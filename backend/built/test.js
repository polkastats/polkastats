"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const chain_1 = require("./lib/chain");
const utils_1 = require("./lib/utils");
const backend_config_1 = require("./backend.config");
const startBlock = 11404400;
const endBlock = 11404500;
const crawlerName = 'blockHarvester';
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
async function main() {
    const client = await (0, chain_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    }
    await (0, chain_1.harvestBlocks)(config, api, client, startBlock, endBlock, loggerOptions);
}
main().catch(console.error).finally(() => process.exit());
