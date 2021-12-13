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
const CereTokenContractAddress = "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6";
module.exports = { config, decimal, CereTokenContractAddress };