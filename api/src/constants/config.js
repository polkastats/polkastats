const config = {
  ChainId: 'u8',
  DepositNonce: 'u64',
  ResourceId: '[u8; 32]',
  ProposalStatus: {
    _enum: ['Initiated', 'Approved', 'Rejected']
  },
  ProposalVotes: {
    votes_for: 'Vec<AccountId>',
    votes_against: 'Vec<AccountId>',
    status: 'ProposalStatus',
    expiry: 'BlockNumber'
  },
  TokenId: 'u256',
  Erc721Token: {
    id: 'TokenId',
    metadata: 'Vec<u8>'
  },
  Address: 'IndicesLookupSource',
  LookupSource: 'IndicesLookupSource'
};

const decimal = 10;
const CERE_MAINNET = 'MAINNET';
const CERE_MAINNET_WS_PROVIDER_URL_DEFAULT = 'wss://rpc.mainnet.cere.network:9945';
const MNEMONIC_EMPTY = '';
module.exports = { config, decimal, CERE_MAINNET, CERE_MAINNET_WS_PROVIDER_URL_DEFAULT, MNEMONIC_EMPTY };
