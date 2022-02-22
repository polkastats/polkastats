"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
require("@polkadot/api-augment");
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield (0, chain_1.getClient)(loggerOptions);
        const api = yield (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
        let synced = yield (0, chain_1.isNodeSynced)(api, loggerOptions);
        while (!synced) {
            yield (0, utils_1.wait)(10000);
            synced = yield (0, chain_1.isNodeSynced)(api, loggerOptions);
        }
        yield (0, chain_1.harvestBlocks)(config, api, client, startBlock, endBlock, loggerOptions);
    });
}
main().catch(console.error).finally(() => process.exit());
