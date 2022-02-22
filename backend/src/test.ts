// @ts-check
import '@polkadot/api-augment/kusama';
import { ApiPromise, WsProvider } from '@polkadot/api';

const startBlock = 11404400;
const endBlock = 11404500;
const chunkSize = 10;

async function main() {
  const api = await getPolkadotAPI();
  await harvestBlocks(api, startBlock, endBlock);
}

main().catch(console.error).finally(() => process.exit());

const harvestBlocks = async (api: ApiPromise, startBlock: number, endBlock: number) => {
  const blocks = range(startBlock, endBlock, 1);
  const chunks = chunker(blocks, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(
        (blockNumber: number) => harvestBlock(api, blockNumber),
      ),
    );
  }
};

const getPolkadotAPI = async (): Promise<ApiPromise> => {
  const wsNode = 'ws://substrate-node:9944';
  const provider = new WsProvider(wsNode);
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  return api;
};

export const harvestBlock = async (api: ApiPromise, blockNumber: number) => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const apiAt = await api.at(blockHash);
    const [
      { block },
      blockEvents,
      blockHeader,
      totalIssuance,
      runtimeVersion,
      activeEra,
      currentIndex,
      chainElectionStatus,
      timestamp,
    ] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      apiAt.query.system.events(),
      api.derive.chain.getHeader(blockHash),
      apiAt.query.balances.totalIssuance(),
      api.rpc.state.getRuntimeVersion(blockHash),
      apiAt.query.staking.activeEra()
        .then((res: any) => (res.toJSON() ? res.toJSON().index : 0))
        .catch((e) => { console.log(e); return 0 }),
      apiAt.query.session.currentIndex()
        .then((res) => (res || 0)),
      apiAt.query.electionProviderMultiPhase.currentPhase(),
      apiAt.query.timestamp.now(),
    ]);

    console.log(blockNumber);

  } catch (error) {
    console.log(error);
  }
};

const chunker = (a: any[], n: number): any[] => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const range = (start: number, stop: number, step: number) => Array
  .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));