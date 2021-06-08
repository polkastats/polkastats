// @ts-check
const { ApiPromise, WsProvider } = require('@polkadot/api');
const pino = require('pino');
const { dbParamInsert } = require('../utils.js');

const logger = pino();
const loggerOptions = {
  crawler: 'activeAccounts',
};

const getAccountId = (account) => account
  .map((e) => e.args)
  .map(([e]) => e)
  .map((e) => e.toHuman());

const fetchAccountIds = async (api) => getAccountId(await api.query.system.account.keys());

const chunker = (a, n) => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const processChunk = async (api, pool, accountId) => {
  const timestamp = Date.now();
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
  await dbParamInsert(pool, query, data, loggerOptions);
};

/**
 *
 * @param {*} wsProviderUrl     Substrate node WS
 * @param {*} pool              Postgres connection pool
 */
const start = async (wsProviderUrl, pool) => {
  logger.info(loggerOptions, 'Running active accounts crawler...');
  const chunkSize = 200;
  const wsProvider = new WsProvider(wsProviderUrl);
  const api = await ApiPromise.create({ provider: wsProvider });
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
        (accountId) => processChunk(api, pool, accountId),
      ),
    );
    const chunkEndTime = new Date().getTime();
    logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${((chunkEndTime - chunkStartTime) / 1000).toFixed(3)}s`);
  }

  await api.disconnect();
  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);
};

module.exports = { start };
