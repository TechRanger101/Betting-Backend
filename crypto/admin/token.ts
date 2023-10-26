import numeral from 'numeral'
import { Wallet, providers, type BigNumber, utils, type Overrides } from 'ethers'

import { adjustTxGasOverrides } from './utils'
import { SEED_AVAX_FAUCET_AMOUNT, SEED_FARE_FAUCET_AMOUNT } from './constants'
import { type FareSpin, FareSpin__factory, type FareToken, FareToken__factory } from '../types'
import cryptoConfig from '../../config/crypto.config'
import { logger } from '../utils'
import { AVAX_FLOOR, FARE_FLOOR } from '../constants'

const { blockchainRpcUrl, privateKey, fareTokenAddress, fareSpinAddress } = cryptoConfig

const provider = new providers.JsonRpcProvider(blockchainRpcUrl)

type CryptoTokenOptions = {
  fundSigner?: Wallet
  fare?: FareToken
  spin?: FareSpin
}

export default class CryptoToken {
  fundSigner!: Wallet
  fare!: FareToken
  spin!: FareSpin
  #overrides: Overrides

  constructor({ fundSigner, fare, spin }: CryptoTokenOptions) {
    this.fundSigner = fundSigner || new Wallet(privateKey, provider)
    this.fare = fare || FareToken__factory.connect(fareTokenAddress, this.fundSigner)
    this.spin = spin || FareSpin__factory.connect(fareSpinAddress, this.fundSigner)
    this.#overrides = adjustTxGasOverrides(5900000, 49930000000, cryptoConfig.txOverrides)
  }

  async ensureBalance(address: string) {
    const transferType = await this.checkShouldTransfer(address)

    if (transferType !== 'none') {
      logger.info(
        `Balance(s) low. Transfering transferType(${transferType}) to ${address.substring(0, 11)}`
      )
    }

    switch (transferType) {
      case 'avax':
        await this.transferAvaxTo(address, SEED_AVAX_FAUCET_AMOUNT)
        break
      case 'fare':
        await this.transferFareTo(address, SEED_FARE_FAUCET_AMOUNT)
        break
      case 'both':
        await this.transferFareTo(address, SEED_FARE_FAUCET_AMOUNT)
        await this.transferAvaxTo(address, SEED_AVAX_FAUCET_AMOUNT)
        break
      case 'none':
        break
      default:
        throw new Error('No condition met')
    }

    return transferType
  }

  async ensureAllowSpinMintBurn(signerWallet: Wallet) {
    const userFare = this.fare.connect(signerWallet)
    const didAllow = await userFare.didUserAllowContract(signerWallet.address, this.spin.address)

    if (!didAllow) {
      logger.info(
        `Submitting allow mint/burn transaction to FareSpin for ${signerWallet.address.substring(
          0,
          7
        )}`
      )

      await userFare.setAllowContractMintBurn(this.spin.address, true, this.#overrides)
    }
  }

  async ensureSeedAccountBalances(signers: Wallet[]) {
    const promiseList = signers.map(signer => {
      const { address } = signer

      return async () => {
        await this.ensureBalance(address)
        return this.ensureAllowSpinMintBurn(signer)
      }
    })

    for (const prom of promiseList) {
      await prom()
    }
  }

  prettyBN(bn: BigNumber) {
    return numeral(utils.formatEther(bn)).format('0,0.00')
  }

  async checkShouldTransfer(address: string): Promise<'fare' | 'avax' | 'none' | 'both'> {
    const fareBalance = await this.fare.balanceOf(address)
    const avaxBalance = await this.fare.provider.getBalance(address)
    let shouldTransferFare = false
    let shouldTransferAvax = false

    if (fareBalance.lt(FARE_FLOOR)) shouldTransferFare = true
    if (avaxBalance.lt(AVAX_FLOOR)) shouldTransferAvax = true

    logger.info(
      `Seed Player(${address.substring(0, 11)}) balances: AVAX(${this.prettyBN(
        avaxBalance
      )}) -- FARE(${this.prettyBN(fareBalance)})`
    )

    if (shouldTransferAvax && shouldTransferFare) {
      return 'both'
    }
    if (shouldTransferAvax && !shouldTransferFare) {
      return 'avax'
    }
    if (!shouldTransferAvax && shouldTransferFare) {
      return 'fare'
    }
    return 'none'
  }

  async transferFareTo(to: string, amount: BigNumber) {
    const tx = await this.fare.transfer(to, amount, this.#overrides)
    const receipt = await tx.wait()
    return receipt
  }

  async transferAvaxTo(to: string, amount: BigNumber) {
    const tx = await this.fundSigner.sendTransaction({
      ...this.#overrides,
      to,
      value: amount,
    })
    const receipt = await tx.wait()
    return receipt
  }
}
