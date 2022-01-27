// @ts-check
import pino from 'pino';
import { wait, getClient, getPolkadotAPI, isNodeSynced, dbParamQuery } from '../lib/utils';
import { backendConfig } from '../backend.config';

const crawlerName = 'activeAccounts';
const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);
const { chunkSize } = config;

const getAccountId = (account) => account
  .map((e) => e.args)
  .map(([e]) => e)
  .map((e) => e.toHuman());

const fetchAccountIds = async (api) => getAccountId(await api.query.system.account.keys());

const chunker = (a, n) => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const processChunk = async (api, client, accountId) => {
  const timestamp = Math.floor(parseInt(Date.now().toString(), 10) / 1000);
  const [block, identity, balances] = await Promise.all([
    api.rpc.chain.getBlock().then((result) => result.block.header.number.toNumber()),
    api.derive.accounts.identity(accountId),
    api.derive.balances.all(accountId),
  ]);
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const identityDisplay = identity.display ? identity.display.toString() : '';
  const identityDisplayParent = identity.displayParent ? identity.displayParent.toString() : '';
  const JSONIdentity = identity.display ? JSON.stringify(identity) : '';
  const JSONbalances = JSON.stringify(balances);
  const nonce = balances.accountNonce.toString();
  const data = [
    accountId,
    JSONIdentity,
    identityDisplay,
    identityDisplayParent,
    JSONbalances,
    availableBalance,
    freeBalance,
    lockedBalance,
    nonce,
    timestamp,
    block,
  ];
  const query = `
    INSERT INTO account (
      account_id,
      identity,
      identity_display,
      identity_display_parent,
      balances,
      available_balance,
      free_balance,
      locked_balance,
      nonce,
      timestamp,
      block_height
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11
    )
    ON CONFLICT (account_id)
    DO UPDATE SET
      identity = EXCLUDED.identity,
      identity_display = EXCLUDED.identity_display,
      identity_display_parent = EXCLUDED.identity_display_parent,
      balances = EXCLUDED.balances,
      available_balance = EXCLUDED.available_balance,
      free_balance = EXCLUDED.free_balance,
      locked_balance = EXCLUDED.locked_balance,
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
  // eslint-disable-next-line no-await-in-loop
  await dbParamQuery(client, query, data, loggerOptions);
};

const crawler = async (delayedStart) => {
  if (delayedStart) {
    logger.debug(loggerOptions, `Delaying active accounts crawler start for ${config.startDelay / 1000}s`);
    await wait(config.startDelay);
  }

  logger.debug(loggerOptions, 'Running active accounts crawler...');

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(api, loggerOptions);
  }

  const startTime = new Date().getTime();
  const accountIds = await fetchAccountIds(api);
  logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
  const chunks = chunker(accountIds, chunkSize);
  logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);

  // eslint-disable-next-line no-restricted-syntax
  for (const chunk of chunks) {
    const chunkStartTime = Date.now();
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      chunk.map(
        (accountId) => processChunk(api, client, accountId),
      ),
    );
    const chunkEndTime = new Date().getTime();
    logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${((chunkEndTime - chunkStartTime) / 1000).toFixed(3)}s`);
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));

  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);

  logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  setTimeout(
    () => crawler(false),
    config.pollingTime,
  );
};

crawler(true).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});
