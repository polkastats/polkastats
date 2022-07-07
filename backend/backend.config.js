// @ts-check
require('dotenv').config();

module.exports = {
  substrateNetwork: process.env.SUBSTRATE_NETWORK || 'kusama',
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'wss://rpc.v2.devnet.cere.network/ws',
  port: process.env.PORT || 8001,
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'polkastats',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'polkastats',
    password: process.env.POSTGRES_PASSWORD || 'polkastats',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  },
  logLevel: process.env.LOG_LEVEL || 'info', // Use 'debug' to see DEBUG level messages
  crawlers: [
    {
      name: 'blockListener',
      enabled: !process.env.BLOCK_LISTENER_DISABLE,
      crawler: './crawlers/blockListener.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
    },
    {
      name: 'blockHarvester',
      enabled: !process.env.BLOCK_HARVESTER_DISABLE,
      crawler: './crawlers/blockHarvester.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
      startDelay: parseInt(process.env.BLOCK_HARVESTER_START_DELAY_MS, 10) || 10 * 1000,
      mode: process.env.BLOCK_HARVESTER_MODE || 'chunks',
      chunkSize: parseInt(process.env.BLOCK_HARVESTER_CHUNK_SIZE, 10) || 10,
      statsPrecision: parseInt(process.env.BLOCK_HARVESTER_STATS_PRECISION, 10) || 2,
      pollingTime:
        parseInt(process.env.BLOCK_LISTENER_POLLING_TIME_MS, 10)
        || 60 * 60 * 1000,
    },
    {
      name: 'ranking',
      enabled: !process.env.RANKING_DISABLE,
      crawler: './crawlers/ranking.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
      startDelay: parseInt(process.env.RANKING_START_DELAY_MS, 10) || 15 * 60 * 1000,
      pollingTime:
        parseInt(process.env.RANKING_POLLING_TIME_MS, 10)
        || 5 * 60 * 1000,
      historySize: 16,
      erasPerDay: 1,
      tokenDecimals: 10,
      featuredTimespan: 60 * 60 * 24 * 7 * 2 * 1000, // 2 weeks
    },
    {
      name: 'activeAccounts',
      enabled: !process.env.ACTIVE_ACCOUNTS_DISABLE,
      crawler: './crawlers/activeAccounts.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
      startDelay: parseInt(process.env.ACTIVE_ACCOUNTS_START_DELAY_MS, 10) || 60 * 1000,
      chunkSize: parseInt(process.env.ACTIVE_ACCOUNTS_CHUNK_SIZE, 10) || 100,
      pollingTime:
        parseInt(process.env.ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10)
        || 6 * 60 * 60 * 1000, // 6 hours
    },
    {
      name: 'ddc',
      enabled: !process.env.DDC_DISABLE,
      crawler: './crawlers/ddc.js',
      // TODO update default to Mainnet once DDC Mainnet deployed. Ticket: https://cerenetwork.atlassian.net/browse/CBI-2050
      contractRpc: process.env.DDC_CONTRACT_RPC || 'wss://rpc.v2.testnet.cere.network/ws',
      contractName: process.env.DDC_CONTRACT_NAME || 'ddc_bucket',
      contractAddress: process.env.DDC_CONTRACT_ADDRESS || '5DTZfAcmZctJodfa4W88BW5QXVBxT4v7UEax91HZCArTih6U',
      pollingTime:
          parseInt(process.env.DDC_POLLING_TIME_MS, 10)
          || 2 * 60 * 1000, // 2 minutes
    },
  ],
};
