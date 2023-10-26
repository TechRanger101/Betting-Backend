import { Wallet, providers, utils as ethUtils } from 'ethers'

import {
  type FareItems,
  FareItems__factory,
  type FareNFTLootBox,
  type FareNFTLootBoxController,
  FareNFTLootBoxController__factory,
  FareNFTLootBox__factory,
  type FareSpin,
  FareSpin__factory,
  type FareToken,
  FareToken__factory,
} from './types'
import * as utils from './utils'
import { FareSpinAPI, FareTokenAPI } from './apis'
import config from '../config/crypto.config'

const {
  fareTokenAddress,
  fareSpinAddress,
  fareItemsAddress,
  fareNftLootboxAddress,
  fareNftLootboxControllerAddress,
  rewardsAddress,
  blockchainRpcUrl,
  privateKey,
} = config

export class Crypto {
  provider!: providers.JsonRpcProvider
  signer!: Wallet
  fare!: FareToken
  spin!: FareSpin
  items!: FareItems
  lootbox!: FareNFTLootBox
  lootboxCtrl!: FareNFTLootBoxController
  rpcUrl = blockchainRpcUrl
  rewardsAddress = rewardsAddress
  utils = utils

  constructor() {
    // this.provider = new providers.WebSocketProvider(this.rpcUrl)
    this.provider = new providers.JsonRpcProvider(this.rpcUrl)
    this.signer = new Wallet(privateKey, this.provider)
    this.fare = FareToken__factory.connect(fareTokenAddress, this.signer)
    this.spin = FareSpin__factory.connect(fareSpinAddress, this.signer)
    this.items = FareItems__factory.connect(fareItemsAddress, this.signer)
    this.lootbox = FareNFTLootBox__factory.connect(fareNftLootboxAddress, this.signer)
    this.lootboxCtrl = FareNFTLootBoxController__factory.connect(
      fareNftLootboxControllerAddress,
      this.signer
    )
  }

  public removeAllContractListeners = () => {
    this.fare.removeAllListeners()
    this.spin.removeAllListeners()
    this.items.removeAllListeners()
    this.lootbox.removeAllListeners()
    this.lootboxCtrl.removeAllListeners()
  }

  public async getETHBalance(publicAddress: string) {
    const eth = ethUtils.formatEther(await this.provider.getBalance(publicAddress))

    return eth
  }

  public async getFareBalance(publicAddress: string) {
    const fare = ethUtils.formatEther(await this.fare.balanceOf(publicAddress))

    return fare
  }

  public async getBalances(publicAddress: string) {
    return {
      eth: await this.getETHBalance(publicAddress),
      fare: await this.getFareBalance(publicAddress),
    }
  }

  public async getRewardsBalance() {
    return this.getFareBalance(this.rewardsAddress)
  }

  public async getFareTotalSupply() {
    const totalSupply = ethUtils.formatEther(await this.fare.totalSupply())

    return totalSupply
  }

  public async signMessage(message: string) {
    return this.signer.signMessage(message)
  }
}

const crypto = new Crypto()

// API Instances
export const fareAPI = new FareTokenAPI(crypto.fare)
export const spinAPI = new FareSpinAPI(crypto.fare, crypto.spin)

export default crypto
