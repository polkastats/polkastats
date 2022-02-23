"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendConfig = void 0;
// @ts-check
require('dotenv').config();
exports.backendConfig = {
    substrateNetwork: process.env.SUBSTRATE_NETWORK || 'kusama',
    wsProviderUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
    postgresConnParams: {
        user: process.env.POSTGRES_USER || 'polkastats',
        host: process.env.POSTGRES_HOST || 'postgres',
        database: process.env.POSTGRES_DATABASE || 'polkastats',
        password: process.env.POSTGRES_PASSWORD || 'polkastats',
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    sentryDSN: process.env.SENTRY_DSN || '',
    substrateApiSidecar: 'http://sidecar:9090',
    crawlers: [
        {
            name: 'blockListener',
            enabled: !process.env.BLOCK_LISTENER_DISABLE,
            crawler: './built/crawlers/blockListener.js',
        },
        {
            name: 'blockHarvester',
            enabled: !process.env.BLOCK_HARVESTER_DISABLE,
            crawler: './built/crawlers/blockHarvester.js',
            apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
            startDelay: parseInt(process.env.BLOCK_HARVESTER_START_DELAY_MS, 10) || 10 * 1000,
            mode: process.env.BLOCK_HARVESTER_MODE || 'chunks',
            chunkSize: parseInt(process.env.BLOCK_HARVESTER_CHUNK_SIZE, 10) || 10,
            statsPrecision: parseInt(process.env.BLOCK_HARVESTER_STATS_PRECISION, 10) || 2,
            pollingTime: parseInt(process.env.BLOCK_LISTENER_POLLING_TIME_MS, 10)
                || 60 * 60 * 1000,
        },
        {
            name: 'ranking',
            enabled: !process.env.RANKING_DISABLE,
            crawler: './built/crawlers/ranking.js',
            startDelay: parseInt(process.env.RANKING_START_DELAY_MS, 10) || 15 * 60 * 1000,
            pollingTime: parseInt(process.env.RANKING_POLLING_TIME_MS, 10)
                || 5 * 60 * 1000,
            historySize: 84,
            erasPerDay: 4,
            tokenDecimals: 12,
            featuredTimespan: 60 * 60 * 24 * 7 * 2 * 1000, // 2 weeks
        },
        {
            name: 'activeAccounts',
            enabled: !process.env.ACTIVE_ACCOUNTS_DISABLE,
            crawler: './built/crawlers/activeAccounts.js',
            startDelay: parseInt(process.env.ACTIVE_ACCOUNTS_START_DELAY_MS, 10) || 60 * 1000,
            chunkSize: parseInt(process.env.ACTIVE_ACCOUNTS_CHUNK_SIZE, 10) || 100,
            pollingTime: parseInt(process.env.ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10)
                || 6 * 60 * 60 * 1000, // 6 hours
        },
    ],
};
