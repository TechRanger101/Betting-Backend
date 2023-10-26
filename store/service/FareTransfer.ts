import type { FareTransfer } from '../schema/types'

import ServiceBase from './ServiceBase'
import { fareAPI } from '../../crypto'
import { zeroAddress, toEth, formatETH, logger, prettyNum } from '../utils'
import { GlobalRedisKey } from '../constants'
import PubSub from '../../pubsub'

interface ICreateOptions {
  jobId?: string
  eventLogId?: string
  from: string
  to: string
  amount: string
  timestamp: number
}

export default class FareTransferService extends ServiceBase<FareTransfer> {
  #totalFareSupply: string

  public get totalFareSupply() {
    return this.#totalFareSupply
  }

  public getTransferType(from: string, to: string): string {
    let transferType = 'transfer'
    if (from === zeroAddress) {
      transferType = 'mint'
    } else if (to === zeroAddress) {
      transferType = 'burn'
    }

    return transferType
  }

  public async create({ jobId = null, eventLogId, from, to, amount, timestamp }: ICreateOptions) {
    const transferType = this.getTransferType(from, to)

    return this.repo.createAndSave({
      jobId,
      eventLogId,
      from,
      to,
      amount,
      transferType,
      timestamp,
    })
  }

  public async updateTotalSupply(_totalFareSupply?: string) {
    let totalFareSupply = _totalFareSupply

    if (!totalFareSupply) {
      totalFareSupply = await fareAPI.getTotalSupply()
    }

    this.#totalFareSupply = totalFareSupply

    await this.client.set(`Global:${GlobalRedisKey.FareTotalSupply}`, totalFareSupply)
    await PubSub.pub<'fare-total-supply-updated'>('fare', 'fare-total-supply-updated', {
      totalSupply: totalFareSupply,
    })

    return totalFareSupply
  }

  public async adjustCachedTotalSupply(transferType: 'mint' | 'burn', amount: string) {
    if (transferType !== 'mint' && transferType !== 'burn')
      throw new Error('Invalid transferType in adjustCachedTotalSupply')
    if (transferType === 'mint' && amount === '50000000000.0') {
      logger.info('Initial mint event ignored')
      return
    }

    const previousSupplyBN = toEth(this.#totalFareSupply || (await fareAPI.getTotalSupply()))

    const bnAmount = toEth(amount)
    let mathKey = transferType === 'mint' ? 'add' : 'sub'

    const newTotalSupply = formatETH(previousSupplyBN[mathKey](bnAmount))
    logger.info(
      `transferType: ${transferType} --- previousSupply: ${prettyNum(
        formatETH(previousSupplyBN)
      )} --- newSupply: ${prettyNum(newTotalSupply)}`
    )
    await this.updateTotalSupply(newTotalSupply)
  }

  public async getCachedTotalSupply() {
    return this.client.get(`Global:${GlobalRedisKey.FareTotalSupply}`)
  }
}
