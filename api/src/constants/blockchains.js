const blockchainNames = {
  CERE: 'CERE',
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
}

const networkNames = {
  DEVNET: 'DEVNET',
  TESTNET: 'TESTNET',
  QANET: 'QANET',
  MAINNET: 'MAINNET'
}

const tokenTypes = {
  ERC20: 'ERC20',
  NATIVE: 'NATIVE'
}

const tokenSymbols = {
  CERE: 'CERE',
  ETH: 'ETH',
  MATIC: 'MATIC'
}

const accountGroups = {
  DDC: 'DDC',
  BRIDGE: 'BRIDGE',
  DAVINCI: 'DAVINCI',
  STATS: 'STATS'
}

const decimals = {}
decimals[blockchainNames.CERE] = 10;
decimals[blockchainNames.POLYGON] = 18;
decimals[blockchainNames.ETHEREUM] = 18;

module.exports = { blockchainNames, tokenSymbols, tokenTypes, accountGroups, networkNames, decimals }