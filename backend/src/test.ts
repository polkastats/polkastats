// @ts-check
import '@polkadot/api-augment/substrate';
import {
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  harvestBlocks,
} from './lib/chain';
import { wait } from './lib/utils';
import { backendConfig } from './backend.config';

const startBlock = 11404400;
const endBlock = 11404500;

const crawlerName = 'blockHarvester';

const loggerOptions = {
  crawler: crawlerName,
};

const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

async function main() {

  const client = await getClient(loggerOptions);

  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);
  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  await harvestBlocks(
    config,
    api,
    client,
    startBlock,
    endBlock,
    loggerOptions,
  );

}

main().catch(console.error).finally(() => process.exit());