// @ts-check
require('dotenv').config();

module.exports = {
  substrateNetwork: process.env.SUBSTRATE_NETWORK || 'kusama',
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'polkastats',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'polkastats',
    password: process.env.POSTGRES_PASSWORD || 'polkastats',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  },
  crawlers: [
    {
      name: 'blockListener',
      enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./lib/crawlers/blockListener'),
    },
    {
      name: 'blockHarvester',
      enabled: !process.env.CRAWLER_BLOCK_HARVESTER_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./lib/crawlers/blockHarvester'),
      config: {
        startDelay: 60 * 1000,
        pollingTime:
          parseInt(process.env.CRAWLER_BLOCK_LISTENER_POLLING_TIME_MS, 10)
          || 60 * 60 * 1000,
      },
    },
    {
      name: 'ranking',
      enabled: !process.env.CRAWLER_RANKING_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./lib/crawlers/ranking'),
      config: {
        startDelay: 15 * 60 * 1000,
        pollingTime:
          parseInt(process.env.CRAWLER_RANKING_POLLING_TIME_MS, 10)
          || 5 * 60 * 1000,
        historySize: 84,
        erasPerDay: 4,
        tokenDecimals: 12,
        featuredTimespan: 60 * 60 * 24 * 7 * 2 * 1000, // 2 weeks
      },
    },
    {
      name: 'activeAccounts',
      enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./lib/crawlers/activeAccounts'),
      config: {
        startDelay: 1 * 60 * 1000,
        pollingTime:
          parseInt(process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10)
          || 6 * 60 * 60 * 1000, // 6 hours
      },
    },
  ],
};
