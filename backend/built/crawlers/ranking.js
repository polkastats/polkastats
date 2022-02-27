"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const chain_1 = require("../lib/chain");
const utils_1 = require("../lib/utils");
const bignumber_js_1 = require("bignumber.js");
const pino_1 = __importDefault(require("pino"));
const backend_config_1 = require("../backend.config");
const crawlerName = 'ranking';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = async (delayedStart) => {
    if (delayedStart) {
        logger.info(loggerOptions, `Delaying ranking crawler start for ${config.startDelay / 1000}s`);
        await (0, utils_1.wait)(config.startDelay);
    }
    logger.info(loggerOptions, 'Starting ranking crawler');
    const startTime = new Date().getTime();
    const client = await (0, chain_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
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
        const lastEraInDb = await (0, chain_1.getLastEraInDb)(client, loggerOptions);
        logger.debug(loggerOptions, `Last era in DB is ${lastEraInDb}`);
        // thousand validators program data
        logger.debug(loggerOptions, 'Fetching thousand validator program validators ...');
        const thousandValidators = await (0, chain_1.getThousandValidators)(loggerOptions);
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
        const eraIndexes = erasHistoric.slice(Math.max(erasHistoric.length - config.historySize, 0));
        const { maxNominatorRewardedPerValidator } = api.consts.staking;
        logger.debug(loggerOptions, 'Step #2');
        const [{ block }, validatorAddresses, waitingInfo, nominators, councilVotes, proposals, referendums,] = await Promise.all([
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
        for (const eraIndex of eraIndexes) {
            const eraPrefs = await api.derive.staking.eraPrefs(eraIndex);
            erasPreferences = erasPreferences.concat(eraPrefs);
        }
        logger.debug(loggerOptions, 'Step #5');
        let erasSlashes = [];
        for (const eraIndex of eraIndexes) {
            const eraSlashes = await api.derive.staking.eraSlashes(eraIndex);
            erasSlashes = erasSlashes.concat(eraSlashes);
        }
        logger.debug(loggerOptions, 'Step #6');
        let erasExposure = [];
        for (const eraIndex of eraIndexes) {
            const eraExposure = await api.derive.staking.eraExposure(eraIndex);
            erasExposure = erasExposure.concat(eraExposure);
        }
        logger.debug(loggerOptions, 'Step #7');
        validators = await Promise.all(validatorAddresses.map((authorityId) => api.derive.staking.query(authorityId, stakingQueryFlags)));
        logger.debug(loggerOptions, 'Step #8');
        validators = await Promise.all(validators.map((validator) => api.derive.accounts.info(validator.accountId).then(({ identity }) => ({
            ...validator,
            identity,
            active: true,
        }))));
        logger.debug(loggerOptions, 'Step #9');
        intentions = await Promise.all(waitingInfo.info.map((intention) => api.derive.accounts.info(intention.accountId).then(({ identity }) => ({
            ...intention,
            identity,
            active: false,
        }))));
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
        const eraPointsHistoryTotalsSum = eraPointsHistoryTotals.reduce((total, num) => total + num, 0);
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
        for (const validator of validators) {
            // eslint-disable-next-line
            for (const nominatorStake of validator.exposure.others) {
                nominatorStakes.push(nominatorStake.value);
            }
        }
        nominatorStakes.sort((a, b) => (a.unwrap().lt(b.unwrap()) ? -1 : 1));
        const minimumStake = nominatorStakes[0];
        logger.debug(loggerOptions, `${activeValidatorCount} active validators`);
        logger.debug(loggerOptions, `${waitingValidatorCount} waiting validators`);
        logger.debug(loggerOptions, `${nominatorCount} nominators`);
        logger.debug(loggerOptions, `Current era is ${currentEra}`);
        logger.debug(loggerOptions, `Active era is ${activeEra}`);
        logger.debug(loggerOptions, `Minimum amount to stake is ${minimumStake}`);
        await Promise.all([
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${activeValidatorCount}' WHERE name = 'active_validator_count'`, loggerOptions),
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${waitingValidatorCount}' WHERE name = 'waiting_validator_count'`, loggerOptions),
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${nominatorCount}' WHERE name = 'nominator_count'`, loggerOptions),
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${currentEra}' WHERE name = 'current_era'`, loggerOptions),
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${activeEra}' WHERE name = 'active_era'`, loggerOptions),
            (0, chain_1.dbQuery)(client, `UPDATE total SET count = '${minimumStake}' WHERE name = 'minimum_stake'`, loggerOptions),
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
        for (const validator of validators) {
            const stashAddress = validator.stashId.toString();
            stashAddressesCreation[stashAddress] = await (0, chain_1.getAddressCreation)(client, stashAddress, loggerOptions);
            if (validator.identity.parent) {
                const stashParentAddress = validator.identity.parent.toString();
                stashAddressesCreation[stashParentAddress] = await (0, chain_1.getAddressCreation)(client, stashParentAddress, loggerOptions);
            }
        }
        let ranking = validators
            .map((validator) => {
            var _a, _b;
            // active
            const { active } = validator;
            const activeRating = active ? 2 : 0;
            // stash
            const stashAddress = validator.stashId.toString();
            // address creation
            let addressCreationRating = 0;
            const stashCreatedAtBlock = parseInt(stashAddressesCreation[stashAddress], 10);
            let stashParentCreatedAtBlock = 0;
            if (validator.identity.parent) {
                stashParentCreatedAtBlock = parseInt(stashAddressesCreation[validator.identity.parent.toString()], 10);
                const best = stashParentCreatedAtBlock > stashCreatedAtBlock
                    ? stashCreatedAtBlock
                    : stashParentCreatedAtBlock;
                if (best <= blockHeight / 4) {
                    addressCreationRating = 3;
                }
                else if (best <= (blockHeight / 4) * 2) {
                    addressCreationRating = 2;
                }
                else if (best <= (blockHeight / 4) * 3) {
                    addressCreationRating = 1;
                }
            }
            else if (stashCreatedAtBlock <= blockHeight / 4) {
                addressCreationRating = 3;
            }
            else if (stashCreatedAtBlock <= (blockHeight / 4) * 2) {
                addressCreationRating = 2;
            }
            else if (stashCreatedAtBlock <= (blockHeight / 4) * 3) {
                addressCreationRating = 1;
            }
            // thousand validators program
            const includedThousandValidators = thousandValidators.some(({ stash }) => stash === stashAddress);
            const thousandValidator = includedThousandValidators
                ? thousandValidators.find(({ stash }) => stash === stashAddress)
                : '';
            // controller
            const controllerAddress = validator.controllerId.toString();
            // identity
            const { verifiedIdentity, hasSubIdentity, name, identityRating } = (0, chain_1.parseIdentity)(validator.identity);
            const identity = JSON.parse(JSON.stringify(validator.identity));
            // sub-accounts
            const { clusterMembers, clusterName } = (0, chain_1.getClusterInfo)(hasSubIdentity, validators, validator.identity);
            if (clusterName && !clusters.includes(clusterName)) {
                clusters.push(clusterName);
            }
            const partOfCluster = clusterMembers > 1;
            const subAccountsRating = hasSubIdentity ? 2 : 0;
            // nominators
            // eslint-disable-next-line
            const nominators = active
                ? validator.exposure.others.length
                : nominations.filter((nomination) => nomination.targets.some((target) => target === validator.accountId.toString())).length;
            const nominatorsRating = nominators > 0 &&
                nominators <= maxNominatorRewardedPerValidator.toNumber()
                ? 2
                : 0;
            // slashes
            const slashes = erasSlashes.filter(
            // eslint-disable-next-line
            ({ validators }) => validators[validator.accountId.toString()]) || [];
            const slashed = slashes.length > 0;
            const slashRating = slashed ? 0 : 2;
            // commission
            const commission = parseInt(validator.validatorPrefs.commission.toString(), 10) /
                10000000;
            const commissionHistory = (0, chain_1.getCommissionHistory)(validator.accountId, erasPreferences);
            const commissionRating = (0, chain_1.getCommissionRating)(commission, commissionHistory);
            // governance
            const councilBacking = ((_a = validator.identity) === null || _a === void 0 ? void 0 : _a.parent)
                ? councilVotes.some((vote) => vote[0].toString() === validator.accountId.toString()) ||
                    councilVotes.some((vote) => vote[0].toString() === validator.identity.parent.toString())
                : councilVotes.some((vote) => vote[0].toString() === validator.accountId.toString());
            const activeInGovernance = ((_b = validator.identity) === null || _b === void 0 ? void 0 : _b.parent)
                ? participateInGovernance.includes(validator.accountId.toString()) ||
                    participateInGovernance.includes(validator.identity.parent.toString())
                : participateInGovernance.includes(validator.accountId.toString());
            let governanceRating = 0;
            if (councilBacking && activeInGovernance) {
                governanceRating = 3;
            }
            else if (councilBacking || activeInGovernance) {
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
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        points,
                    });
                    if (validator.stakingLedger.claimedRewards.includes(era)) {
                        eraPayoutState = 'paid';
                    }
                    else {
                        eraPayoutState = 'pending';
                    }
                    // era performance
                    const eraTotalStake = new bignumber_js_1.BigNumber(erasExposure.find((eraExposure) => eraExposure.era === era).validators[stashAddress].total);
                    const eraSelfStake = new bignumber_js_1.BigNumber(erasExposure.find((eraExposure) => eraExposure.era === era).validators[stashAddress].own);
                    const eraOthersStake = eraTotalStake.minus(eraSelfStake);
                    stakeHistory.push({
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        self: eraSelfStake.toString(10),
                        others: eraOthersStake.toString(10),
                        total: eraTotalStake.toString(10),
                    });
                    eraPerformance =
                        (points * (1 - commission / 100)) /
                            eraTotalStake
                                .div(new bignumber_js_1.BigNumber(10).pow(config.tokenDecimals))
                                .toNumber();
                    performanceHistory.push({
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        performance: eraPerformance,
                    });
                }
                else {
                    // validator was not active in that era
                    eraPointsHistory.push({
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        points: 0,
                    });
                    stakeHistory.push({
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        self: 0,
                        others: 0,
                        total: 0,
                    });
                    performanceHistory.push({
                        era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                        performance: 0,
                    });
                }
                payoutHistory.push({
                    era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                    status: eraPayoutState,
                });
                // total performance
                performance += eraPerformance;
            });
            const eraPointsHistoryValidator = eraPointsHistory.reduce((total, era) => total + era.points, 0);
            const eraPointsPercent = (eraPointsHistoryValidator * 100) / eraPointsHistoryTotalsSum;
            const eraPointsRating = eraPointsHistoryValidator > eraPointsAverage ? 2 : 0;
            const payoutRating = (0, chain_1.getPayoutRating)(config, payoutHistory);
            // stake
            const selfStake = active
                ? new bignumber_js_1.BigNumber(validator.exposure.own.toString())
                : new bignumber_js_1.BigNumber(validator.stakingLedger.total.toString());
            const totalStake = active
                ? new bignumber_js_1.BigNumber(validator.exposure.total.toString())
                : selfStake;
            const otherStake = active
                ? totalStake.minus(selfStake)
                : new bignumber_js_1.BigNumber(0);
            // performance
            if (performance > maxPerformance) {
                maxPerformance = performance;
            }
            if (performance < minPerformance) {
                minPerformance = performance;
            }
            const showClusterMember = true;
            // VRC score
            const totalRating = activeRating +
                addressCreationRating +
                identityRating +
                subAccountsRating +
                nominatorsRating +
                commissionRating +
                eraPointsRating +
                slashRating +
                governanceRating +
                payoutRating;
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
            const relativePerformance = ((validator.performance - minPerformance) /
                (maxPerformance - minPerformance)).toFixed(6);
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
            const era = new bignumber_js_1.BigNumber(eraIndex.toString()).toString(10);
            const eraPerformances = ranking.map(({ performanceHistory }) => performanceHistory.find((performance) => performance.era === era)
                .performance);
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
        logger.debug(loggerOptions, `MEDIUM cluster size is between ${Math.round(largestCluster / 3)} and ${Math.round(largestCluster / 3) * 2}`);
        logger.debug(loggerOptions, `LARGE cluster size is between ${Math.round((largestCluster / 3) * 2)} and ${largestCluster}`);
        // find Pareto-dominated validators
        logger.debug(loggerOptions, 'Finding dominated validators');
        const dominatedStart = new Date().getTime();
        ranking = ranking.map((validator) => {
            // populate relativePerformanceHistory
            const relativePerformanceHistory = [];
            validator.performanceHistory.forEach((performance) => {
                const eraMinPerformance = minMaxEraPerformance.find(({ era }) => era === performance.era).min;
                const eraMaxPerformance = minMaxEraPerformance.find(({ era }) => era === performance.era).max;
                const relativePerformance = ((performance.performance - eraMinPerformance) /
                    (eraMaxPerformance - eraMinPerformance)).toFixed(6);
                relativePerformanceHistory.push({
                    era: performance.era,
                    relativePerformance: parseFloat(relativePerformance),
                });
            });
            // dominated validator logic
            let dominated = false;
            for (const opponent of ranking) {
                if (opponent !== validator &&
                    parseFloat(opponent.relativePerformance) >=
                        parseFloat(validator.relativePerformance) &&
                    opponent.selfStake.gte(validator.selfStake) &&
                    opponent.activeEras >= validator.activeEras &&
                    opponent.totalRating >= validator.totalRating) {
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
        logger.debug(loggerOptions, `Found ${ranking.filter(({ dominated }) => dominated).length} dominated validators in ${((dominatedEnd - dominatedStart) /
            1000).toFixed(3)}s`);
        // cluster categorization
        logger.debug(loggerOptions, 'Random selection of validators based on cluster size');
        let validatorsToHide = [];
        for (const cluster of clusters) {
            const clusterMembers = ranking.filter(({ clusterName }) => clusterName === cluster);
            const clusterSize = clusterMembers[0].clusterMembers;
            // EXTRASMALL: 2 - Show all (2)
            let show = 2;
            if (clusterSize > 50) {
                // EXTRALARGE: 51-150 - Show 20% val. (up to 30)
                show = Math.floor(clusterSize * 0.2);
            }
            else if (clusterSize > 20) {
                // LARGE: 21-50 - Show 40% val. (up to 20)
                show = Math.floor(clusterSize * 0.4);
            }
            else if (clusterSize > 10) {
                // MEDIUM: 11-20 - Show 60% val. (up to 12)
                show = Math.floor(clusterSize * 0.6);
            }
            else if (clusterSize > 2) {
                // SMALL: 3-10 - Show 80% val. (up to 8)
                show = Math.floor(clusterSize * 0.8);
            }
            const hide = clusterSize - show;
            // randomly select 'hide' number of validators
            // from cluster and set 'showClusterMember' prop to false
            const rankingPositions = clusterMembers.map((validator) => validator.rank);
            validatorsToHide = validatorsToHide.concat((0, utils_1.getRandom)(rankingPositions, hide));
        }
        ranking = ranking.map((validator) => {
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
            await Promise.all(ranking.map((validator) => (0, chain_1.insertEraValidatorStats)(client, validator, activeEra, loggerOptions)));
            logger.debug(loggerOptions, 'Storing era stats averages in db...');
            await Promise.all(eraIndexes.map((eraIndex) => (0, chain_1.insertEraValidatorStatsAvg)(client, eraIndex, loggerOptions)));
        }
        else {
            logger.debug(loggerOptions, 'Updating era averages is not needed!');
        }
        logger.debug(loggerOptions, `Storing ${ranking.length} validators in db...`);
        await Promise.all(ranking.map((validator) => (0, chain_1.insertRankingValidator)(client, validator, blockHeight, startTime, loggerOptions)));
        logger.debug(loggerOptions, 'Cleaning old data');
        await (0, chain_1.dbQuery)(client, `DELETE FROM ranking WHERE block_height != '${blockHeight}';`, loggerOptions);
        // featured validator
        const sql = 'SELECT stash_address, timestamp FROM featured ORDER BY timestamp DESC LIMIT 1';
        const res = await (0, chain_1.dbQuery)(client, sql, loggerOptions);
        if (res.rows.length === 0) {
            await (0, chain_1.addNewFeaturedValidator)(config, client, ranking, loggerOptions);
        }
        else {
            const currentFeatured = res.rows[0];
            const currentTimestamp = new Date().getTime();
            if (currentTimestamp - currentFeatured.timestamp >
                config.featuredTimespan) {
                // timespan passed, let's add a new featured validator
                await (0, chain_1.addNewFeaturedValidator)(config, client, ranking, loggerOptions);
            }
        }
        logger.debug(loggerOptions, 'Disconnecting from API');
        await api
            .disconnect()
            .catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));
        logger.debug(loggerOptions, 'Disconnecting from DB');
        await client
            .end()
            .catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));
        const endTime = new Date().getTime();
        const dataProcessingTime = endTime - dataCollectionEndTime;
        logger.info(loggerOptions, `Added ${ranking.length} validators in ${((dataCollectionTime + dataProcessingTime) /
            1000).toFixed(3)}s`);
        logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    }
    catch (error) {
        logger.error(loggerOptions, `General error in ranking crawler: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    setTimeout(() => crawler(false), config.pollingTime);
};
crawler(true).catch((error) => {
    logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});
