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
exports.insertEraValidatorStatsAvg = exports.getLastEraInDb = exports.getAddressCreation = exports.insertEraValidatorStats = exports.insertRankingValidator = exports.addNewFeaturedValidator = exports.getClusterInfo = exports.getPayoutRating = exports.getCommissionRating = exports.getCommissionHistory = exports.parseIdentity = exports.getIdentityRating = exports.subIdentity = exports.getClusterName = exports.getName = exports.isVerifiedIdentity = exports.getThousandValidators = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = require("bignumber.js");
const db_1 = require("./db");
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const getThousandValidators = async (loggerOptions) => {
    try {
        const response = await axios_1.default.get('https://kusama.w3f.community/candidates');
        return response.data;
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error fetching Thousand Validator Program stats: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
        return [];
    }
};
exports.getThousandValidators = getThousandValidators;
const isVerifiedIdentity = (identity) => {
    if (identity.judgements.length === 0) {
        return false;
    }
    return identity.judgements
        .filter(([, judgement]) => !judgement.isFeePaid)
        .some(([, judgement]) => judgement.isKnownGood || judgement.isReasonable);
};
exports.isVerifiedIdentity = isVerifiedIdentity;
const getName = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return `${identity.displayParent}/${identity.display}`;
    }
    return identity.display || '';
};
exports.getName = getName;
const getClusterName = (identity) => identity.displayParent || '';
exports.getClusterName = getClusterName;
const subIdentity = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return true;
    }
    return false;
};
exports.subIdentity = subIdentity;
const getIdentityRating = (name, verifiedIdentity, hasAllFields) => {
    if (verifiedIdentity && hasAllFields) {
        return 3;
    }
    if (verifiedIdentity && !hasAllFields) {
        return 2;
    }
    if (name !== '') {
        return 1;
    }
    return 0;
};
exports.getIdentityRating = getIdentityRating;
const parseIdentity = (identity) => {
    const verifiedIdentity = (0, exports.isVerifiedIdentity)(identity);
    const hasSubIdentity = (0, exports.subIdentity)(identity);
    const name = (0, exports.getName)(identity);
    const hasAllFields = (identity === null || identity === void 0 ? void 0 : identity.display) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.legal) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.web) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.email) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.twitter) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.riot) !== undefined;
    const identityRating = (0, exports.getIdentityRating)(name, verifiedIdentity, hasAllFields);
    return {
        verifiedIdentity,
        hasSubIdentity,
        name,
        identityRating,
    };
};
exports.parseIdentity = parseIdentity;
const getCommissionHistory = (accountId, erasPreferences) => {
    const commissionHistory = [];
    erasPreferences.forEach(({ era, validators }) => {
        if (validators[accountId]) {
            commissionHistory.push({
                era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                commission: (validators[accountId].commission / 10000000).toFixed(2),
            });
        }
        else {
            commissionHistory.push({
                era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                commission: null,
            });
        }
    });
    return commissionHistory;
};
exports.getCommissionHistory = getCommissionHistory;
const getCommissionRating = (commission, commissionHistory) => {
    if (commission !== 100 && commission !== 0) {
        if (commission > 10) {
            return 1;
        }
        if (commission >= 5) {
            if (commissionHistory.length > 1 &&
                commissionHistory[0] > commissionHistory[commissionHistory.length - 1]) {
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
exports.getCommissionRating = getCommissionRating;
const getPayoutRating = (config, payoutHistory) => {
    const pendingEras = payoutHistory.filter((era) => era.status === 'pending').length;
    if (pendingEras <= config.erasPerDay) {
        return 3;
    }
    if (pendingEras <= 3 * config.erasPerDay) {
        return 2;
    }
    if (pendingEras < 7 * config.erasPerDay) {
        return 1;
    }
    return 0;
};
exports.getPayoutRating = getPayoutRating;
const getClusterInfo = (hasSubIdentity, validators, validatorIdentity) => {
    if (!hasSubIdentity) {
        // string detection
        // samples: DISC-SOFT-01, BINANCE_KSM_9, SNZclient-1
        if (validatorIdentity.display) {
            const stringSize = 6;
            const clusterMembers = validators.filter(({ identity }) => (identity.display || '').substring(0, stringSize) ===
                validatorIdentity.display.substring(0, stringSize)).length;
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
    const clusterMembers = validators.filter(({ identity }) => identity.displayParent === validatorIdentity.displayParent).length;
    const clusterName = (0, exports.getClusterName)(validatorIdentity);
    return {
        clusterName,
        clusterMembers,
    };
};
exports.getClusterInfo = getClusterInfo;
//
//   featured rules:
//
// - maximum commission is 10%
// - at least 20 KSM own stake
// - no previously featured
//
const addNewFeaturedValidator = async (config, client, ranking, loggerOptions) => {
    // get previously featured
    const alreadyFeatured = [];
    const sql = 'SELECT stash_address, timestamp FROM featured';
    const res = await (0, db_1.dbQuery)(client, sql, loggerOptions);
    res.rows.forEach((validator) => alreadyFeatured.push(validator.stash_address));
    // get candidates that meet the rules
    const featuredCandidates = ranking
        .filter((validator) => validator.commission <= 10 &&
        validator.selfStake.div(10 ** config.tokenDecimals).gte(20) &&
        !validator.active &&
        !alreadyFeatured.includes(validator.stashAddress))
        .map(({ rank }) => rank);
    // get random featured validator of the week
    const shuffled = [...featuredCandidates].sort(() => 0.5 - Math.random());
    const randomRank = shuffled[0];
    const featured = ranking.find((validator) => validator.rank === randomRank);
    await (0, db_1.dbQuery)(client, `INSERT INTO featured (stash_address, name, timestamp) VALUES ('${featured.stashAddress}', '${featured.name}', '${new Date().getTime()}')`, loggerOptions);
    logger_1.logger.debug(loggerOptions, `New featured validator added: ${featured.name} ${featured.stashAddress}`);
};
exports.addNewFeaturedValidator = addNewFeaturedValidator;
const insertRankingValidator = async (client, validator, blockHeight, startTime, loggerOptions) => {
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
      nominations,
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
      $49,
      $50
    )
    ON CONFLICT ON CONSTRAINT ranking_pkey 
    DO NOTHING`;
    const data = [
        blockHeight,
        validator.rank,
        validator.active,
        validator.activeRating,
        validator.name,
        JSON.stringify(validator.identity),
        validator.hasSubIdentity,
        validator.subAccountsRating,
        validator.verifiedIdentity,
        validator.identityRating,
        validator.stashAddress,
        validator.stashCreatedAtBlock,
        validator.stashParentCreatedAtBlock,
        validator.addressCreationRating,
        validator.controllerAddress,
        validator.includedThousandValidators,
        JSON.stringify(validator.thousandValidator),
        validator.partOfCluster,
        validator.clusterName,
        validator.clusterMembers,
        validator.showClusterMember,
        validator.nominators,
        validator.nominatorsRating,
        validator.nominations,
        validator.commission,
        JSON.stringify(validator.commissionHistory),
        validator.commissionRating,
        validator.activeEras,
        JSON.stringify(validator.eraPointsHistory),
        validator.eraPointsPercent,
        validator.eraPointsRating,
        validator.performance,
        JSON.stringify(validator.performanceHistory),
        validator.relativePerformance,
        JSON.stringify(validator.relativePerformanceHistory),
        validator.slashed,
        validator.slashRating,
        JSON.stringify(validator.slashes),
        validator.councilBacking,
        validator.activeInGovernance,
        validator.governanceRating,
        JSON.stringify(validator.payoutHistory),
        validator.payoutRating,
        validator.selfStake.toString(10),
        validator.otherStake.toString(10),
        validator.totalStake.toString(10),
        JSON.stringify(validator.stakeHistory),
        validator.totalRating,
        validator.dominated,
        startTime,
    ];
    await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
};
exports.insertRankingValidator = insertRankingValidator;
const insertEraValidatorStats = async (client, validator, activeEra, loggerOptions) => {
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
    let data = [validator.stashAddress, activeEra, validator.totalRating];
    await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
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
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    for (const perfHistoryItem of validator.relativePerformanceHistory) {
        if (perfHistoryItem.relativePerformance &&
            perfHistoryItem.relativePerformance > 0) {
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
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
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
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
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
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
};
exports.insertEraValidatorStats = insertEraValidatorStats;
const getAddressCreation = async (client, address, loggerOptions) => {
    const query = "SELECT block_number FROM event WHERE method = 'NewAccount' AND data LIKE $1";
    const res = await (0, db_1.dbParamQuery)(client, query, [`%${address}%`], loggerOptions);
    if (res) {
        if (res.rows.length > 0) {
            if (res.rows[0].block_number) {
                return res.rows[0].block_number;
            }
        }
    }
    // if not found we assume it was created in genesis block
    return 0;
};
exports.getAddressCreation = getAddressCreation;
const getLastEraInDb = async (client, loggerOptions) => {
    // TODO: check also:
    // era_points_avg, era_relative_performance_avg, era_self_stake_avg
    const query = 'SELECT era FROM era_commission_avg ORDER BY era DESC LIMIT 1';
    const res = await (0, db_1.dbQuery)(client, query, loggerOptions);
    if (res) {
        if (res.rows.length > 0) {
            if (res.rows[0].era) {
                return res.rows[0].era;
            }
        }
    }
    return '0';
};
exports.getLastEraInDb = getLastEraInDb;
const insertEraValidatorStatsAvg = async (client, eraIndex, loggerOptions) => {
    const era = new bignumber_js_1.BigNumber(eraIndex.toString()).toString(10);
    let data = [era];
    let sql = 'SELECT AVG(commission) AS commission_avg FROM era_commission WHERE era = $1 AND commission != 100';
    let res = await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].commission_avg) {
            data = [era, res.rows[0].commission_avg];
            sql =
                'INSERT INTO era_commission_avg (era, commission_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_commission_avg_pkey DO NOTHING;';
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql =
        'SELECT AVG(self_stake) AS self_stake_avg FROM era_self_stake WHERE era = $1';
    data = [era];
    res = await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].self_stake_avg) {
            const selfStakeAvg = res.rows[0].self_stake_avg
                .toString(10)
                .split('.')[0];
            data = [era, selfStakeAvg];
            sql =
                'INSERT INTO era_self_stake_avg (era, self_stake_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_self_stake_avg_pkey DO NOTHING;';
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql =
        'SELECT AVG(relative_performance) AS relative_performance_avg FROM era_relative_performance WHERE era = $1';
    data = [era];
    res = await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].relative_performance_avg) {
            data = [era, res.rows[0].relative_performance_avg];
            sql =
                'INSERT INTO era_relative_performance_avg (era, relative_performance_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_relative_performance_avg_pkey DO NOTHING;';
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql = 'SELECT AVG(points) AS points_avg FROM era_points WHERE era = $1';
    data = [era];
    res = await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].points_avg) {
            data = [era, res.rows[0].points_avg];
            sql =
                'INSERT INTO era_points_avg (era, points_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_points_avg_pkey DO NOTHING;';
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
};
exports.insertEraValidatorStatsAvg = insertEraValidatorStatsAvg;
