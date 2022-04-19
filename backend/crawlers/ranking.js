// @ts-check
const { BigNumber } = require('bignumber.js');
const pino = require('pino');
const axios = require('axios').default;
const {
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  wait,
  dbQuery,
  dbParamQuery,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const crawlerName = 'ranking';
const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const getThousandValidators = async () => {
  try {
    const response = await axios.get('https://kusama.w3f.community/candidates');
    return response.data;
  } catch (error) {
    logger.error(loggerOptions, `Error fetching Thousand Validator Program stats: ${JSON.stringify(error)}`);
    return [];
  }
};

const isVerifiedIdentity = (identity) => {
  if (identity.judgements.length === 0) {
    return false;
  }
  return identity.judgements
    .filter(([, judgement]) => !judgement.isFeePaid)
    .some(([, judgement]) => judgement.isKnownGood || judgement.isReasonable);
};

const getName = (identity) => {
  if (
    identity.displayParent
    && identity.displayParent !== ''
    && identity.display
    && identity.display !== ''
  ) {
    return `${identity.displayParent}/${identity.display}`;
  }
  return identity.display || '';
};

const getClusterName = (identity) => identity.displayParent || '';

const subIdentity = (identity) => {
  if (
    identity.displayParent
    && identity.displayParent !== ''
    && identity.display
    && identity.display !== ''
  ) {
    return true;
  }
  return false;
};

const getIdentityRating = (name, verifiedIdentity, hasAllFields) => {
  if (verifiedIdentity && hasAllFields) {
    return 3;
  } if (verifiedIdentity && !hasAllFields) {
    return 2;
  } if (name !== '') {
    return 1;
  }
  return 0;
};

const parseIdentity = (identity) => {
  const verifiedIdentity = isVerifiedIdentity(identity);
  const hasSubIdentity = subIdentity(identity);
  const name = getName(identity);
  const hasAllFields = identity.display
    && identity.legal
    && identity.web
    && identity.email
    && identity.twitter
    && identity.riot;
  const identityRating = getIdentityRating(name, verifiedIdentity, hasAllFields);
  return {
    verifiedIdentity,
    hasSubIdentity,
    name,
    identityRating,
  };
};

const getCommissionHistory = (accountId, erasPreferences) => {
  const commissionHistory = [];
  erasPreferences.forEach(({ era, validators }) => {
    if (validators[accountId]) {
      commissionHistory.push({
        era: new BigNumber(era.toString()).toString(10),
        commission: (validators[accountId].commission / 10000000).toFixed(2),
      });
    } else {
      commissionHistory.push({
        era: new BigNumber(era.toString()).toString(10),
        commission: null,
      });
    }
  });
  return commissionHistory;
};

const getCommissionRating = (commission, commissionHistory) => {
  if (commission !== 100 && commission !== 0) {
    if (commission > 10) {
      return 1;
    }
    if (commission >= 5) {
      if (
        commissionHistory.length > 1
        && commissionHistory[0] > commissionHistory[commissionHistory.length - 1]
      ) {
        return 3;
      }
      return 2;
    }
    if (commission < 5) {
      return 3;
    }
  }
  return 0;
};

const getPayoutRating = (payoutHistory) => {
  const pendingEras = payoutHistory.filter((era) => era.status === 'pending').length;
  if (pendingEras <= config.erasPerDay) {
    return 3;
  } if (pendingEras <= 3 * config.erasPerDay) {
    return 2;
  } if (pendingEras < 7 * config.erasPerDay) {
    return 1;
  }
  return 0;
};

const getClusterInfo = (hasSubIdentity, validators, validatorIdentity) => {
  if (!hasSubIdentity) {
    // string detection
    // samples: DISC-SOFT-01, BINANCE_KSM_9, SNZclient-1
    if (validatorIdentity.display) {
      const stringSize = 6;
      const clusterMembers = validators.filter(
        ({ identity }) => (identity.display || '').substring(0, stringSize)
            === validatorIdentity.display.substring(0, stringSize),
      ).length;
      const clusterName = validatorIdentity.display
        .replace(/\d{1,2}$/g, '')
        .replace(/-$/g, '')
        .replace(/_$/g, '');
      return {
        clusterName,
        clusterMembers,
      };
    }
    return {
      clusterName: '',
      clusterMembers: 0,
    };
  }

  const clusterMembers = validators.filter(
    ({ identity }) => identity.displayParent === validatorIdentity.displayParent,
  ).length;
  const clusterName = getClusterName(validatorIdentity);
  return {
    clusterName,
    clusterMembers,
  };
};

// from https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
const getRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const addNewFeaturedValidator = async (client, ranking) => {
  // rules:
  // - maximum commission is 10%
  // - at least 20 KSM own stake
  // - no previously featured

  // get previously featured
  const alreadyFeatured = [];
  const sql = 'SELECT stash_address, timestamp FROM featured';
  const res = await dbQuery(client, sql, loggerOptions);
  res.rows.forEach((validator) => alreadyFeatured.push(validator.stash_address));
  // get candidates that meet the rules
  const featuredCandidates = ranking
    .filter((validator) => validator.commission <= 10
      && validator.selfStake.div(10 ** config.tokenDecimals).gte(20)
      && !validator.active && !alreadyFeatured.includes(validator.stashAddress))
    .map(({ rank }) => rank);
  // get random featured validator of the week
  const shuffled = [...featuredCandidates].sort(() => 0.5 - Math.random());
  const randomRank = shuffled[0];
  const featured = ranking.find((validator) => validator.rank === randomRank);
  await dbQuery(
    client,
    `INSERT INTO featured (stash_address, name, timestamp) VALUES ('${featured.stashAddress}', '${featured.name}', '${new Date().getTime()}')`,
    loggerOptions,
  );
  logger.debug(loggerOptions, `New featured validator added: ${featured.name} ${featured.stashAddress}`);
};

const insertRankingValidator = async (client, validator, blockHeight, startTime) => {
  const sql = `INSERT INTO ranking (
    block_height,
    rank,
    active,
    active_rating,
    name,
    identity,
    has_sub_identity,
    sub_accounts_rating,
    verified_identity,
    identity_rating,
    stash_address,
    stash_address_creation_block,
    stash_parent_address_creation_block,
    address_creation_rating,
    controller_address,
    included_thousand_validators,
    thousand_validator,
    part_of_cluster,
    cluster_name,
    cluster_members,
    show_cluster_member,
    nominators,
    nominators_rating,
    commission,
    commission_history,
    commission_rating,
    active_eras,
    era_points_history,
    era_points_percent,
    era_points_rating,
    performance,
    performance_history,
    relative_performance,
    relative_performance_history,
    slashed,
    slash_rating,
    slashes,
    council_backing,
    active_in_governance,
    governance_rating,
    payout_history,
    payout_rating,
    self_stake,
    other_stake,
    total_stake,
    stake_history,
    total_rating,
    dominated,
    timestamp
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15,
    $16,
    $17,
    $18,
    $19,
    $20,
    $21,
    $22,
    $23,
    $24,
    $25,
    $26,
    $27,
    $28,
    $29,
    $30,
    $31,
    $32,
    $33,
    $34,
    $35,
    $36,
    $37,
    $38,
    $39,
    $40,
    $41,
    $42,
    $43,
    $44,
    $45,
    $46,
    $47,
    $48,
    $49
  )
  ON CONFLICT ON CONSTRAINT ranking_pkey 
  DO NOTHING`;
  const data = [
    `${blockHeight}`,
    `${validator.rank}`,
    `${validator.active}`,
    `${validator.activeRating}`,
    `${validator.name}`,
    `${JSON.stringify(validator.identity)}`,
    `${validator.hasSubIdentity}`,
    `${validator.subAccountsRating}`,
    `${validator.verifiedIdentity}`,
    `${validator.identityRating}`,
    `${validator.stashAddress}`,
    `${validator.stashCreatedAtBlock}`,
    `${validator.stashParentCreatedAtBlock}`,
    `${validator.addressCreationRating}`,
    `${validator.controllerAddress}`,
    `${validator.includedThousandValidators}`,
    `${JSON.stringify(validator.thousandValidator)}`,
    `${validator.partOfCluster}`,
    `${validator.clusterName}`,
    `${validator.clusterMembers}`,
    `${validator.showClusterMember}`,
    `${validator.nominators}`,
    `${validator.nominatorsRating}`,
    `${validator.commission}`,
    `${JSON.stringify(validator.commissionHistory)}`,
    `${validator.commissionRating}`,
    `${validator.activeEras}`,
    `${JSON.stringify(validator.eraPointsHistory)}`,
    `${validator.eraPointsPercent}`,
    `${validator.eraPointsRating}`,
    `${validator.performance}`,
    `${JSON.stringify(validator.performanceHistory)}`,
    `${validator.relativePerformance}`,
    `${JSON.stringify(validator.relativePerformanceHistory)}`,
    `${validator.slashed}`,
    `${validator.slashRating}`,
    `${JSON.stringify(validator.slashes)}`,
    `${validator.councilBacking}`,
    `${validator.activeInGovernance}`,
    `${validator.governanceRating}`,
    `${JSON.stringify(validator.payoutHistory)}`,
    `${validator.payoutRating}`,
    `${validator.selfStake}`,
    `${validator.otherStake}`,
    `${validator.totalStake}`,
    `${JSON.stringify(validator.stakeHistory)}`,
    `${validator.totalRating}`,
    `${validator.dominated}`,
    `${startTime}`,
  ];
  await dbParamQuery(client, sql, data, loggerOptions);
};

const insertEraValidatorStats = async (client, validator, activeEra) => {
  let sql = `INSERT INTO era_vrc_score (
    stash_address,
    era,
    vrc_score
  ) VALUES (
    $1,
    $2,
    $3
  )
  ON CONFLICT ON CONSTRAINT era_vrc_score_pkey 
  DO NOTHING;`;
  let data = [
    validator.stashAddress,
    activeEra,
    validator.totalRating,
  ];
  // eslint-disable-next-line no-await-in-loop
  await dbParamQuery(client, sql, data, loggerOptions);
  // eslint-disable-next-line no-restricted-syntax
  for (const commissionHistoryItem of validator.commissionHistory) {
    if (commissionHistoryItem.commission) {
      sql = `INSERT INTO era_commission (
        stash_address,
        era,
        commission
      ) VALUES (
        $1,
        $2,
        $3
      )
      ON CONFLICT ON CONSTRAINT era_commission_pkey 
      DO NOTHING;`;
      data = [
        validator.stashAddress,
        commissionHistoryItem.era,
        commissionHistoryItem.commission,
      ];
      // eslint-disable-next-line no-await-in-loop
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const perfHistoryItem of validator.relativePerformanceHistory) {
    if (perfHistoryItem.relativePerformance && perfHistoryItem.relativePerformance > 0) {
      sql = `INSERT INTO era_relative_performance (
        stash_address,
        era,
        relative_performance
      ) VALUES (
        $1,
        $2,
        $3
      )
      ON CONFLICT ON CONSTRAINT era_relative_performance_pkey 
      DO NOTHING;`;
      data = [
        validator.stashAddress,
        perfHistoryItem.era,
        perfHistoryItem.relativePerformance,
      ];
      // eslint-disable-next-line no-await-in-loop
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const stakefHistoryItem of validator.stakeHistory) {
    if (stakefHistoryItem.self && stakefHistoryItem.self !== 0) {
      sql = `INSERT INTO era_self_stake (
        stash_address,
        era,
        self_stake
      ) VALUES (
        $1,
        $2,
        $3
      )
      ON CONFLICT ON CONSTRAINT era_self_stake_pkey 
      DO NOTHING;`;
      data = [
        validator.stashAddress,
        stakefHistoryItem.era,
        stakefHistoryItem.self,
      ];
      // eslint-disable-next-line no-await-in-loop
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const eraPointsHistoryItem of validator.eraPointsHistory) {
    if (eraPointsHistoryItem.points && eraPointsHistoryItem.points !== 0) {
      sql = `INSERT INTO era_points (
        stash_address,
        era,
        points
      ) VALUES (
        $1,
        $2,
        $3
      )
      ON CONFLICT ON CONSTRAINT era_points_pkey 
      DO NOTHING;`;
      data = [
        validator.stashAddress,
        eraPointsHistoryItem.era,
        eraPointsHistoryItem.points,
      ];
      // eslint-disable-next-line no-await-in-loop
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
};

const getAddressCreation = async (client, address) => {
  const query = "SELECT block_number FROM event WHERE method = 'NewAccount' AND data LIKE $1";
  const res = await dbParamQuery(client, query, [`%${address}%`], loggerOptions);
  if (res) {
    if (res.rows.length > 0) {
      if (res.rows[0].block_number) {
        return res.rows[0].block_number;
      }
    }
  }
  // if not found we assume that it's included in genesis
  return 0;
};

const getLastEraInDb = async (client) => {
  // TODO: check also:
  // era_points_avg, era_relative_performance_avg, era_self_stake_avg
  const query = 'SELECT era FROM era_commission_avg ORDER BY era DESC LIMIT 1';
  const res = await dbQuery(client, query, loggerOptions);
  if (res) {
    if (res.rows.length > 0) {
      if (res.rows[0].era) {
        return res.rows[0].era;
      }
    }
  }
  return 0;
};

const insertEraValidatorStatsAvg = async (client, eraIndex) => {
  const era = new BigNumber(eraIndex.toString()).toString(10);
  let sql = `SELECT AVG(commission) AS commission_avg FROM era_commission WHERE era = '${era}' AND commission != 100`;
  let res = await dbQuery(client, sql, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].commission_avg) {
      sql = `INSERT INTO era_commission_avg (era, commission_avg) VALUES ('${era}', '${res.rows[0].commission_avg}') ON CONFLICT ON CONSTRAINT era_commission_avg_pkey DO NOTHING;`;
      await dbQuery(client, sql, loggerOptions);
    }
  }
  sql = `SELECT AVG(self_stake) AS self_stake_avg FROM era_self_stake WHERE era = '${era}'`;
  res = await dbQuery(client, sql, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].self_stake_avg) {
      const selfStakeAvg = res.rows[0].self_stake_avg.toString(10).split('.')[0];
      sql = `INSERT INTO era_self_stake_avg (era, self_stake_avg) VALUES ('${era}', '${selfStakeAvg}') ON CONFLICT ON CONSTRAINT era_self_stake_avg_pkey DO NOTHING;`;
      await dbQuery(client, sql, loggerOptions);
    }
  }
  sql = `SELECT AVG(relative_performance) AS relative_performance_avg FROM era_relative_performance WHERE era = '${era}'`;
  res = await dbQuery(client, sql, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].relative_performance_avg) {
      sql = `INSERT INTO era_relative_performance_avg (era, relative_performance_avg) VALUES ('${era}', '${res.rows[0].relative_performance_avg}') ON CONFLICT ON CONSTRAINT era_relative_performance_avg_pkey DO NOTHING;`;
      await dbQuery(client, sql, loggerOptions);
    }
  }
  sql = `SELECT AVG(points) AS points_avg FROM era_points WHERE era = '${era}'`;
  res = await dbQuery(client, sql, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].points_avg) {
      sql = `INSERT INTO era_points_avg (era, points_avg) VALUES ('${era}', '${res.rows[0].points_avg}') ON CONFLICT ON CONSTRAINT era_points_avg_pkey DO NOTHING;`;
      await dbQuery(client, sql, loggerOptions);
    }
  }
};

const crawler = async (delayedStart) => {
  if (delayedStart) {
    logger.info(loggerOptions, `Delaying ranking crawler start for ${config.startDelay / 1000}s`);
    await wait(config.startDelay);
  }

  logger.info(loggerOptions, 'Starting ranking crawler');
  const startTime = new Date().getTime();

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(api, loggerOptions);
  }

  const clusters = [];
  const stakingQueryFlags = {
    withDestination: false,
    withExposure: true,
    withLedger: true,
    withNominations: false,
    withPrefs: true,
  };
  const minMaxEraPerformance = [];
  const participateInGovernance = [];
  let validators = [];
  let intentions = [];
  let maxPerformance = 0;
  let minPerformance = 0;

  //
  // data collection
  //

  try {
    const lastEraInDb = await getLastEraInDb(client);
    logger.debug(loggerOptions, `Last era in DB is ${lastEraInDb}`);

    // thousand validators program data
    logger.debug(loggerOptions, 'Fetching thousand validator program validators ...');
    const thousandValidators = await getThousandValidators();
    logger.debug(loggerOptions, `Got info of ${thousandValidators.length} validators from Thousand Validators program API`);

    // chain data
    logger.debug(loggerOptions, 'Fetching chain data ...');
    const withActive = false;

    logger.debug(loggerOptions, 'Step #1');
    const [erasHistoric, chainCurrentEra, chainActiveEra] = await Promise.all([
      api.derive.staking.erasHistoric(withActive),
      api.query.staking.currentEra(),
      api.query.staking.activeEra(),
    ]);
    const eraIndexes = erasHistoric.slice(
      Math.max(erasHistoric.length - config.historySize, 0),
    );
    const { maxNominatorRewardedPerValidator } = api.consts.staking;

    logger.debug(loggerOptions, 'Step #2');
    const [
      { block },
      validatorAddresses,
      waitingInfo,
      nominators,
      councilVotes,
      proposals,
      referendums,
    ] = await Promise.all([
      api.rpc.chain.getBlock(),
      api.query.session.validators(),
      api.derive.staking.waitingInfo(stakingQueryFlags),
      api.query.staking.nominators.entries(),
      api.derive.council.votes(),
      api.derive.democracy.proposals(),
      api.derive.democracy.referendums(),
    ]);

    logger.debug(loggerOptions, 'Step #3');
    // eslint-disable-next-line no-underscore-dangle
    const erasPoints = await api.derive.staking._erasPoints(eraIndexes, withActive);

    logger.debug(loggerOptions, 'Step #4');
    let erasPreferences = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const eraIndex of eraIndexes) {
      // eslint-disable-next-line no-await-in-loop
      const eraPrefs = await api.derive.staking.eraPrefs(eraIndex);
      erasPreferences = erasPreferences.concat(eraPrefs);
    }

    logger.debug(loggerOptions, 'Step #5');
    let erasSlashes = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const eraIndex of eraIndexes) {
      // eslint-disable-next-line no-await-in-loop
      const eraSlashes = await api.derive.staking.eraSlashes(eraIndex);
      erasSlashes = erasSlashes.concat(eraSlashes);
    }

    logger.debug(loggerOptions, 'Step #6');
    let erasExposure = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const eraIndex of eraIndexes) {
      // eslint-disable-next-line no-await-in-loop
      const eraExposure = await api.derive.staking.eraExposure(eraIndex);
      erasExposure = erasExposure.concat(eraExposure);
    }

    logger.debug(loggerOptions, 'Step #7');
    validators = await Promise.all(
      validatorAddresses.map(
        (authorityId) => api.derive.staking.query(authorityId, stakingQueryFlags),
      ),
    );

    logger.debug(loggerOptions, 'Step #8');
    validators = await Promise.all(
      validators.map(
        (validator) => api.derive.accounts.info(validator.accountId).then(({ identity }) => ({
          ...validator,
          identity,
          active: true,
        })),
      ),
    );

    logger.debug(loggerOptions, 'Step #9');
    intentions = await Promise.all(
      waitingInfo.info.map(
        (intention) => api.derive.accounts.info(intention.accountId).then(({ identity }) => ({
          ...intention,
          identity,
          active: false,
        })),
      ),
    );
    const dataCollectionEndTime = new Date().getTime();
    const dataCollectionTime = dataCollectionEndTime - startTime;
    logger.debug(loggerOptions, 'Done!');

    //
    // data processing
    //
    logger.debug(loggerOptions, 'Processing data ...');
    const blockHeight = parseInt(block.header.number.toString(), 10);
    const numActiveValidators = validatorAddresses.length;
    const eraPointsHistoryTotals = [];
    erasPoints.forEach(({ eraPoints }) => {
      eraPointsHistoryTotals.push(parseInt(eraPoints.toString(), 10));
    });
    const eraPointsHistoryTotalsSum = eraPointsHistoryTotals.reduce(
      (total, num) => total + num,
      0,
    );
    const eraPointsAverage = eraPointsHistoryTotalsSum / numActiveValidators;

    // dashboard metrics
    const activeValidatorCount = validatorAddresses.length;
    const waitingValidatorCount = waitingInfo.info.length;
    const nominatorCount = nominators.length;
    const currentEra = chainCurrentEra.toString();
    const activeEra = JSON.parse(JSON.stringify(chainActiveEra)).index;

    // minimun stake
    logger.debug(loggerOptions, 'Finding minimum stake');
    const nominatorStakes = [];
    // eslint-disable-next-line
    for (const validator of validators){
      // eslint-disable-next-line
      for (const nominatorStake of validator.exposure.others){
        nominatorStakes.push(nominatorStake.value);
      }
    }
    nominatorStakes.sort((a, b) => ((a.unwrap().lt(b.unwrap())) ? -1 : 1));
    const minimumStake = nominatorStakes[0];

    logger.debug(loggerOptions, `${activeValidatorCount} active validators`);
    logger.debug(loggerOptions, `${waitingValidatorCount} waiting validators`);
    logger.debug(loggerOptions, `${nominatorCount} nominators`);
    logger.debug(loggerOptions, `Current era is ${currentEra}`);
    logger.debug(loggerOptions, `Active era is ${activeEra}`);
    logger.debug(loggerOptions, `Minimum amount to stake is ${minimumStake}`);

    await Promise.all([
      dbQuery(
        client,
        `UPDATE total SET count = '${activeValidatorCount}' WHERE name = 'active_validator_count'`,
        loggerOptions,
      ),
      dbQuery(
        client,
        `UPDATE total SET count = '${waitingValidatorCount}' WHERE name = 'waiting_validator_count'`,
        loggerOptions,
      ),
      dbQuery(
        client,
        `UPDATE total SET count = '${nominatorCount}' WHERE name = 'nominator_count'`,
        loggerOptions,
      ),
      dbQuery(
        client,
        `UPDATE total SET count = '${currentEra}' WHERE name = 'current_era'`,
        loggerOptions,
      ),
      dbQuery(
        client,
        `UPDATE total SET count = '${activeEra}' WHERE name = 'active_era'`,
        loggerOptions,
      ),
      dbQuery(
        client,
        `UPDATE total SET count = '${minimumStake}' WHERE name = 'minimum_stake'`,
        loggerOptions,
      ),
    ]);

    // eslint-disable-next-line
    const nominations = nominators.map(([key, nominations]) => {
      const nominator = key.toHuman()[0];
      // eslint-disable-next-line
      const targets = nominations.toJSON()['targets'];
      return {
        nominator,
        targets,
      };
    });
    proposals.forEach(({ seconds, proposer }) => {
      participateInGovernance.push(proposer.toString());
      seconds.forEach((accountId) => participateInGovernance.push(accountId.toString()));
    });
    referendums.forEach(({ votes }) => {
      votes.forEach(({ accountId }) => participateInGovernance.push(accountId.toString()));
    });

    // Merge validators and intentions
    validators = validators.concat(intentions);

    // stash & identity parent address creation block
    const stashAddressesCreation = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const validator of validators) {
      const stashAddress = validator.stashId.toString();
      // eslint-disable-next-line no-await-in-loop
      stashAddressesCreation[stashAddress] = await getAddressCreation(client, stashAddress);
      if (validator.identity.parent) {
        const stashParentAddress = validator.identity.parent.toString();
        // eslint-disable-next-line no-await-in-loop
        stashAddressesCreation[stashParentAddress] = await getAddressCreation(
          client, stashParentAddress,
        );
      }
    }

    let ranking = validators
      .map((validator) => {
        // active
        const { active } = validator;
        const activeRating = active ? 2 : 0;

        // stash
        const stashAddress = validator.stashId.toString();

        // address creation
        const BLOCKS_PER_DAY = 60 * 60 * 24 / 6;
        const BLOCKS_FOR_3 = 80 * BLOCKS_PER_DAY;
        const BLOCKS_FOR_2 = 60 * BLOCKS_PER_DAY;
        const BLOCKS_FOR_1 = 30 * BLOCKS_PER_DAY;
        let addressCreationRating = 0;
        const stashCreatedAtBlock = parseInt(stashAddressesCreation[stashAddress], 10);
        let stashParentCreatedAtBlock = 0;
        if (validator.identity.parent) {
          stashParentCreatedAtBlock = parseInt(
            stashAddressesCreation[validator.identity.parent.toString()], 10,
          );
          const best = stashParentCreatedAtBlock > stashCreatedAtBlock
            ? stashCreatedAtBlock
            : stashParentCreatedAtBlock;
          if (best <= blockHeight - BLOCKS_FOR_3) {
            addressCreationRating = 3;
          } else if (best <= blockHeight - BLOCKS_FOR_2) {
            addressCreationRating = 2;
          } else if (best <= blockHeight - BLOCKS_FOR_1) {
            addressCreationRating = 1;
          }
        } else if (stashCreatedAtBlock <= blockHeight - BLOCKS_FOR_3) {
          addressCreationRating = 3;
        } else if (stashCreatedAtBlock <= blockHeight - BLOCKS_FOR_2) {
          addressCreationRating = 2;
        } else if (stashCreatedAtBlock <= blockHeight - BLOCKS_FOR_1) {
          addressCreationRating = 1;
        }

        // thousand validators program
        const includedThousandValidators = thousandValidators.some(
          ({ stash }) => stash === stashAddress,
        );
        const thousandValidator = includedThousandValidators ? thousandValidators.find(
          ({ stash }) => stash === stashAddress,
        ) : '';

        // controller
        const controllerAddress = validator.controllerId.toString();

        // identity
        const {
          verifiedIdentity,
          hasSubIdentity,
          name,
          identityRating,
        } = parseIdentity(validator.identity);
        const identity = JSON.parse(JSON.stringify(validator.identity));

        // sub-accounts
        const { clusterMembers, clusterName } = getClusterInfo(
          hasSubIdentity,
          validators,
          validator.identity,
        );
        if (clusterName && !clusters.includes(clusterName)) {
          clusters.push(clusterName);
        }
        const partOfCluster = clusterMembers > 1;
        const subAccountsRating = hasSubIdentity ? 2 : 0;

        // nominators
        // eslint-disable-next-line
        const nominators = active
          ? validator.exposure.others.length
          : nominations.filter((nomination) => nomination.targets.some(
            (target) => target === validator.accountId.toString(),
          )).length;
        const nominatorsRating = nominators > 0
            && nominators <= maxNominatorRewardedPerValidator.toNumber()
          ? 2
          : 0;

        // slashes
        const slashes = erasSlashes.filter(
          // eslint-disable-next-line
          ({ validators }) => validators[validator.accountId.toString()],
        ) || [];
        const slashed = slashes.length > 0;
        const slashRating = slashed ? 0 : 2;

        // commission
        const commission = parseInt(
          validator.validatorPrefs.commission.toString(),
          10,
        ) / 10000000;
        const commissionHistory = getCommissionHistory(
          validator.accountId,
          erasPreferences,
        );
        const commissionRating = getCommissionRating(
          commission,
          commissionHistory,
        );

        // governance
        const councilBacking = validator.identity?.parent
          ? councilVotes.some(
            (vote) => vote[0].toString() === validator.accountId.toString(),
          )
            || councilVotes.some(
              (vote) => vote[0].toString() === validator.identity.parent.toString(),
            )
          : councilVotes.some(
            (vote) => vote[0].toString() === validator.accountId.toString(),
          );
        const activeInGovernance = validator.identity?.parent
          ? participateInGovernance.includes(validator.accountId.toString())
            || participateInGovernance.includes(
              validator.identity.parent.toString(),
            )
          : participateInGovernance.includes(validator.accountId.toString());
        let governanceRating = 0;
        if (councilBacking && activeInGovernance) {
          governanceRating = 3;
        } else if (councilBacking || activeInGovernance) {
          governanceRating = 2;
        }

        // era points and frecuency of payouts
        const eraPointsHistory = [];
        const payoutHistory = [];
        const performanceHistory = [];
        const stakeHistory = [];
        let activeEras = 0;
        let performance = 0;
        // eslint-disable-next-line
        erasPoints.forEach((eraPoints) => {
          const { era } = eraPoints;
          let eraPayoutState = 'inactive';
          let eraPerformance = 0;
          if (eraPoints.validators[stashAddress]) {
            activeEras += 1;
            const points = parseInt(eraPoints.validators[stashAddress].toString(), 10);
            eraPointsHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              points,
            });
            if (validator.stakingLedger.claimedRewards.includes(era)) {
              eraPayoutState = 'paid';
            } else {
              eraPayoutState = 'pending';
            }
            // era performance
            const eraTotalStake = new BigNumber(
              erasExposure.find(
                (eraExposure) => eraExposure.era === era,
              ).validators[stashAddress].total,
            );
            const eraSelfStake = new BigNumber(
              erasExposure.find(
                (eraExposure) => eraExposure.era === era,
              ).validators[stashAddress].own,
            );
            const eraOthersStake = eraTotalStake.minus(eraSelfStake);
            stakeHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              self: eraSelfStake.toString(10),
              others: eraOthersStake.toString(10),
              total: eraTotalStake.toString(10),
            });
            eraPerformance = (points * (1 - (commission / 100)))
              / (eraTotalStake.div(new BigNumber(10).pow(config.tokenDecimals)).toNumber());
            performanceHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              performance: eraPerformance,
            });
          } else {
            // validator was not active in that era
            eraPointsHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              points: 0,
            });
            stakeHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              self: 0,
              others: 0,
              total: 0,
            });
            performanceHistory.push({
              era: new BigNumber(era.toString()).toString(10),
              performance: 0,
            });
          }
          payoutHistory.push({
            era: new BigNumber(era.toString()).toString(10),
            status: eraPayoutState,
          });
          // total performance
          performance += eraPerformance;
        });
        const eraPointsHistoryValidator = eraPointsHistory.reduce(
          (total, era) => total + era.points,
          0,
        );
        const eraPointsPercent = (eraPointsHistoryValidator * 100) / eraPointsHistoryTotalsSum;
        const eraPointsRating = eraPointsHistoryValidator > eraPointsAverage ? 2 : 0;
        const payoutRating = getPayoutRating(payoutHistory);

        // stake
        const selfStake = active
          ? new BigNumber(validator.exposure.own.toString())
          : new BigNumber(validator.stakingLedger.total.toString());
        const totalStake = active
          ? new BigNumber(validator.exposure.total.toString())
          : selfStake;
        const otherStake = active
          ? totalStake.minus(selfStake)
          : new BigNumber(0);

        // performance
        if (performance > maxPerformance) {
          maxPerformance = performance;
        }
        if (performance < minPerformance) {
          minPerformance = performance;
        }

        const showClusterMember = true;

        // VRC score
        const totalRating = activeRating
          + addressCreationRating
          + identityRating
          + subAccountsRating
          + nominatorsRating
          + commissionRating
          + eraPointsRating
          + slashRating
          + governanceRating
          + payoutRating;

        return {
          active,
          activeRating,
          name,
          identity,
          hasSubIdentity,
          subAccountsRating,
          verifiedIdentity,
          identityRating,
          stashAddress,
          stashCreatedAtBlock,
          stashParentCreatedAtBlock,
          addressCreationRating,
          controllerAddress,
          includedThousandValidators,
          thousandValidator,
          partOfCluster,
          clusterName,
          clusterMembers,
          showClusterMember,
          nominators,
          nominatorsRating,
          commission,
          commissionHistory,
          commissionRating,
          activeEras,
          eraPointsHistory,
          eraPointsPercent,
          eraPointsRating,
          performance,
          performanceHistory,
          slashed,
          slashRating,
          slashes,
          councilBacking,
          activeInGovernance,
          governanceRating,
          payoutHistory,
          payoutRating,
          selfStake,
          otherStake,
          totalStake,
          stakeHistory,
          totalRating,
        };
      })
      .sort((a, b) => (a.totalRating < b.totalRating ? 1 : -1))
      .map((validator, rank) => {
        const relativePerformance = ((validator.performance - minPerformance)
          / (maxPerformance - minPerformance)).toFixed(6);
        const dominated = false;
        const relativePerformanceHistory = [];
        return {
          rank: rank + 1,
          relativePerformance,
          relativePerformanceHistory,
          ...validator,
          dominated,
        };
      });

    // populate minMaxEraPerformance
    eraIndexes.forEach((eraIndex) => {
      const era = new BigNumber(eraIndex.toString()).toString(10);
      const eraPerformances = ranking.map(
        ({ performanceHistory }) => performanceHistory.find(
          (performance) => performance.era === era,
        ).performance,
      );
      minMaxEraPerformance.push({
        era,
        min: Math.min(...eraPerformances),
        max: Math.max(...eraPerformances),
      });
    });

    // find largest cluster size
    const largestCluster = Math.max(...Array.from(ranking, (o) => o.clusterMembers));
    logger.debug(loggerOptions, `LARGEST cluster size is ${largestCluster}`);
    logger.debug(loggerOptions, `SMALL cluster size is between 2 and ${Math.round(largestCluster / 3)}`);
    logger.debug(loggerOptions, `MEDIUM cluster size is between ${Math.round(largestCluster / 3)} and ${(Math.round(largestCluster / 3) * 2)}`);
    logger.debug(loggerOptions, `LARGE cluster size is between ${Math.round((largestCluster / 3) * 2)} and ${largestCluster}`);
    // find Pareto-dominated validators
    logger.debug(loggerOptions, 'Finding dominated validators');
    const dominatedStart = new Date().getTime();
    ranking = ranking
      .map((validator) => {
        // populate relativePerformanceHistory
        const relativePerformanceHistory = [];
        validator.performanceHistory.forEach((performance) => {
          const eraMinPerformance = minMaxEraPerformance.find(
            ({ era }) => era === performance.era,
          ).min;
          const eraMaxPerformance = minMaxEraPerformance.find(
            ({ era }) => era === performance.era,
          ).max;
          const relativePerformance = ((performance.performance - eraMinPerformance)
          / (eraMaxPerformance - eraMinPerformance)).toFixed(6);
          relativePerformanceHistory.push({
            era: performance.era,
            relativePerformance: parseFloat(relativePerformance),
          });
        });
        // dominated validator logic
        let dominated = false;
        // eslint-disable-next-line no-restricted-syntax
        for (const opponent of ranking) {
          if (
            opponent !== validator
            && (
              parseFloat(opponent.relativePerformance)
                >= parseFloat(validator.relativePerformance)
              && opponent.selfStake.gte(validator.selfStake)
              && opponent.activeEras >= validator.activeEras
              && opponent.totalRating >= validator.totalRating
            )
          ) {
            dominated = true;
            break;
          }
        }
        return {
          ...validator,
          relativePerformanceHistory,
          dominated,
        };
      });
    const dominatedEnd = new Date().getTime();
    logger.debug(loggerOptions, `Found ${ranking.filter(({ dominated }) => dominated).length} dominated validators in ${((dominatedEnd - dominatedStart) / 1000).toFixed(3)}s`);

    // cluster categorization
    logger.debug(loggerOptions, 'Random selection of validators based on cluster size');
    let validatorsToHide = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const cluster of clusters) {
      const clusterMembers = ranking.filter(({ clusterName }) => clusterName === cluster);
      const clusterSize = clusterMembers[0].clusterMembers;
      // EXTRASMALL: 2 - Show all (2)
      let show = 2;
      if (clusterSize > 50) {
        // EXTRALARGE: 51-150 - Show 20% val. (up to 30)
        show = Math.floor(clusterSize * 0.2);
      } else if (clusterSize > 20) {
        // LARGE: 21-50 - Show 40% val. (up to 20)
        show = Math.floor(clusterSize * 0.4);
      } else if (clusterSize > 10) {
        // MEDIUM: 11-20 - Show 60% val. (up to 12)
        show = Math.floor(clusterSize * 0.6);
      } else if (clusterSize > 2) {
        // SMALL: 3-10 - Show 80% val. (up to 8)
        show = Math.floor(clusterSize * 0.8);
      }
      const hide = clusterSize - show;
      // randomly select 'hide' number of validators
      // from cluster and set 'showClusterMember' prop to false
      const rankingPositions = clusterMembers.map((validator) => validator.rank);
      validatorsToHide = validatorsToHide.concat(getRandom(rankingPositions, hide));
    }
    ranking = ranking
      .map((validator) => {
        const modValidator = validator;
        if (validatorsToHide.includes(validator.rank)) {
          modValidator.showClusterMember = false;
        }
        return modValidator;
      });
    logger.debug(loggerOptions, `Finished, ${validatorsToHide.length} validators hided!`);

    // We want to store era stats only when there's a new consolidated era in chain history
    if (parseInt(activeEra, 10) - 1 > parseInt(lastEraInDb, 10)) {
      logger.debug(loggerOptions, 'Storing era stats in db...');
      await Promise.all(
        ranking.map((validator) => insertEraValidatorStats(client, validator, activeEra)),
      );
      logger.debug(loggerOptions, 'Storing era stats averages in db...');
      await Promise.all(
        eraIndexes.map((eraIndex) => insertEraValidatorStatsAvg(client, eraIndex)),
      );
    } else {
      logger.debug(loggerOptions, 'Updating era averages is not needed!');
    }

    logger.debug(loggerOptions, `Storing ${ranking.length} validators in db...`);
    await Promise.all(
      ranking.map((validator) => insertRankingValidator(client, validator, blockHeight, startTime)),
    );

    logger.debug(loggerOptions, 'Cleaning old data');
    await dbQuery(
      client,
      `DELETE FROM ranking WHERE block_height != '${blockHeight}';`,
      loggerOptions,
    );

    // featured validator
    const sql = 'SELECT stash_address, timestamp FROM featured ORDER BY timestamp DESC LIMIT 1';
    const res = await dbQuery(client, sql, loggerOptions);
    if (res.rows.length === 0) {
      await addNewFeaturedValidator(client, ranking);
    } else {
      const currentFeatured = res.rows[0];
      const currentTimestamp = new Date().getTime();
      if (currentTimestamp - currentFeatured.timestamp > config.featuredTimespan) {
        // timespan passed, let's add a new featured validator
        await addNewFeaturedValidator(client, ranking);
      }
    }

    logger.debug(loggerOptions, 'Disconnecting from API');
    await api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));

    logger.debug(loggerOptions, 'Disconnecting from DB');
    await client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));

    const endTime = new Date().getTime();
    const dataProcessingTime = endTime - dataCollectionEndTime;
    logger.info(loggerOptions, `Added ${ranking.length} validators in ${((dataCollectionTime + dataProcessingTime) / 1000).toFixed(3)}s`);
    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  } catch (error) {
    logger.error(loggerOptions, `General error in ranking crawler: ${JSON.stringify(error)}`);
  }
  setTimeout(
    () => crawler(false),
    config.pollingTime,
  );
};

crawler(true).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});
