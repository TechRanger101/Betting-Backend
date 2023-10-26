import type { Overrides } from 'ethers'

const {
  FARE_TOKEN_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  FARE_SPIN_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  FARE_ITEMS_ADDRESS = '0x95401dc811bb5740090279Ba06cfA8fcF6113778',
  FARE_NFT_LOOTBOX_ADDRESS = '0x998abeb3E57409262aE5b751f60747921B33613E',
  FARE_NFT_LOOTBOX_CONTROLLER_ADDRESS = '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49',
  REWARDS_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  BLOCKCHAIN_ETH_URL = 'http://0.0.0.0:8545',
  INFURA_API_KEY = '31aadaed31984e0e865701e3c96cb93b',
  PRIVATE_KEY = '',
  BLOCKCHAIN_ENV = 'local',
} = process.env

// Default override for transactions
// const txOverrides: Overrides =
//   BLOCKCHAIN_ENV === 'local'
//     ? {
//         gasLimit: 2100000,
//         gasPrice: 70000000,
//       }
//     : {}
const txOverrides: Overrides = {
  gasLimit: 2100000,
  gasPrice: 70000000,
}

const config = {
  fareTokenAddress: FARE_TOKEN_ADDRESS,
  fareSpinAddress: FARE_SPIN_ADDRESS,
  fareItemsAddress: FARE_ITEMS_ADDRESS,
  fareNftLootboxAddress: FARE_NFT_LOOTBOX_ADDRESS,
  fareNftLootboxControllerAddress: FARE_NFT_LOOTBOX_CONTROLLER_ADDRESS,
  rewardsAddress: REWARDS_ADDRESS,
  blockchainRpcUrl: BLOCKCHAIN_ETH_URL,
  infuraApiKey: INFURA_API_KEY,
  privateKey: PRIVATE_KEY, // @NOTE: We need to ensure that this private key is totally secured in production (multi-sig)
  blockchainEnv: BLOCKCHAIN_ENV as 'local' | 'testnet',
  shouldAutoCreateBatchEntries: false,
  txOverrides,
}

export default config
