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
exports.harvestBlock = void 0;
// @ts-check
require("@polkadot/api-augment/kusama");
const api_1 = require("@polkadot/api");
const startBlock = 11404400;
const endBlock = 11404500;
const chunkSize = 10;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const api = yield getPolkadotAPI();
        yield harvestBlocks(api, startBlock, endBlock);
    });
}
main().catch(console.error).finally(() => process.exit());
const harvestBlocks = (api, startBlock, endBlock) => __awaiter(void 0, void 0, void 0, function* () {
    const blocks = range(startBlock, endBlock, 1);
    const chunks = chunker(blocks, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((blockNumber) => (0, exports.harvestBlock)(api, blockNumber)));
    }
});
const getPolkadotAPI = () => __awaiter(void 0, void 0, void 0, function* () {
    const wsNode = 'ws://substrate-node:9944';
    const provider = new api_1.WsProvider(wsNode);
    const api = yield api_1.ApiPromise.create({ provider });
    yield api.isReady;
    return api;
});
const harvestBlock = (api, blockNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    try {
        const blockHash = yield api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = yield api.at(blockHash);
        const [{ block }, blockEvents, blockHeader, totalIssuance, runtimeVersion, activeEra, currentIndex, chainElectionStatus, timestamp,] = yield Promise.all([
            api.rpc.chain.getBlock(blockHash),
            apiAt.query.system.events(),
            api.derive.chain.getHeader(blockHash),
            apiAt.query.balances.totalIssuance(),
            api.rpc.state.getRuntimeVersion(blockHash),
            apiAt.query.staking.activeEra()
                .then((res) => (res.toJSON() ? res.toJSON().index : 0))
                .catch((e) => { console.log(e); return 0; }),
            apiAt.query.session.currentIndex()
                .then((res) => (res || 0)),
            apiAt.query.electionProviderMultiPhase.currentPhase(),
            apiAt.query.timestamp.now(),
        ]);
        console.log(blockNumber);
    }
    catch (error) {
        console.log(error);
    }
});
exports.harvestBlock = harvestBlock;
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const range = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
