// @ts-check
const pino = require('pino');
const {
    wait,
    getClient,
    getPolkadotAPI,
    isNodeSynced,
    dbParamQuery,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const crawlerName = 'ss58PrefixMigration';

const logger = pino({
    level: backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
    ({name}) => name === crawlerName,
);

console.log('Config is', config);

const crawler = async () => {

    logger.info(loggerOptions, 'Running ss58 prefix migration crawler...');

    const client = await getClient(loggerOptions);

    console.log('Client is', client);
};

crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});
