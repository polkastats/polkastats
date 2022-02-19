// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://substrate-node:9944');

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  const blockNumber = 11404462;
  const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  const { block } = await api.rpc.chain.getBlock(blockHash);
  const apiAt = await api.at(blockHash);
  const blockEvents = await apiAt.query.system.events();
  console.log(JSON.stringify(block, null, 2));
  console.log(JSON.stringify(blockEvents, null, 2));
}

main().catch(console.error).finally(() => process.exit());