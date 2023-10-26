import type { BigNumberish } from 'ethers'

import type { ContractMode } from '../schema/types'

import ServiceBase from './ServiceBase'
import { spinAPI } from '../../crypto'
import { formatBN, formatETH, BNToNumber } from '../utils'

const spin = spinAPI.contract

export default class ContractModeService extends ServiceBase<ContractMode> {
  public async getActiveGameModes() {
    return this.repo.search().where('isActive').equals(true).returnAll()
  }

  public async getContractModeById(id: number) {
    return this.repo.search().where('id').eq(id).returnFirst()
  }

  // Ensures that contractModes in the smart contract are update to date in Redis
  public async ensureGameModes() {
    const currentGameModeId = (await spin.getCurrentContractModeId()).toNumber()
    const gameModeIds: number[] = [...Array(currentGameModeId).keys()]

    const promiseList: Promise<any>[] = gameModeIds.map(contractModeId => {
      return this.createOrUpdate(contractModeId)
    })

    return Promise.all(promiseList)
  }

  public async createOrUpdate(
    contractModeId: BigNumberish,
    timestamp = Date.now(),
    eventLogId?: string,
    jobId: string = null
  ) {
    const [
      id,
      cardinality,
      contractExpectedValueFloor,
      mintMultiplier,
      minAmount,
      maxAmount,
      entryLimit,
      isActive,
    ] = await spin.contractModes(contractModeId)

    const contractMode = await this.getContractModeById(id.toNumber())

    // If contractMode exists ensure values are up to date
    if (contractMode) {
      contractMode.id = BNToNumber(id)
      contractMode.cardinality = BNToNumber(cardinality)
      contractMode.contractExpectedValueFloor = formatBN(contractExpectedValueFloor)
      contractMode.mintMultiplier = BNToNumber(mintMultiplier)
      contractMode.minAmount = formatETH(minAmount)
      contractMode.maxAmount = formatETH(maxAmount)
      contractMode.entryLimit = BNToNumber(entryLimit)
      contractMode.isActive = isActive
      contractMode.timestamp = timestamp
      contractMode.jobId = jobId

      if (eventLogId) {
        contractMode.eventLogId = eventLogId
      }

      await this.repo.save(contractMode)

      // If contractMode does not exist create and save
    } else {
      await this.repo.createAndSave({
        eventLogId,
        id: BNToNumber(id),
        cardinality: BNToNumber(cardinality),
        contractExpectedValueFloor: formatBN(contractExpectedValueFloor),
        mintMultiplier: BNToNumber(mintMultiplier),
        minAmount: formatETH(minAmount),
        maxAmount: formatETH(maxAmount),
        entryLimit: BNToNumber(entryLimit),
        timestamp,
        isActive,
        jobId,
      })
    }

    return contractMode
  }
}
