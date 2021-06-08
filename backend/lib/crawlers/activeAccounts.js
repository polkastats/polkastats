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

/**
 *
 * @param {*} wsProviderUrl     Substrate node WS
 * @param {*} pool              Postgres connection pool
 */
const start = async (wsProviderUrl, pool) => {
  logger.info(loggerOptions, 'Running active accounts crawler...');
  const wsProvider = new WsProvider(wsProviderUrl);
  const api = await ApiPromise.create({ provider: wsProvider });
  const startTime = new Date().getTime();
  const accountIds = await fetchAccountIds(api);
  logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
  let processed = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const accountId of accountIds) {
    const loopStartTime = Date.now();
    // eslint-disable-next-line no-await-in-loop
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
      loopStartTime,
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
      ON CONFLICT (account_id) WHERE EXCLUDED.block_height > block_height
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
    ;`;
    // eslint-disable-next-line no-await-in-loop
    await dbParamInsert(pool, query, data, loggerOptions);
    processed += 1;
    const loopEndTime = new Date().getTime();
    logger.info(loggerOptions, `Processed account ${processed} of ${accountIds.length} (${accountId}) in ${((loopEndTime - loopEndTime) / 1000).toFixed(3)}s`);
  }

  await api.disconnect();
  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

module.exports = { start };
