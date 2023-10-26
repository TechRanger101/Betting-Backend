import { BigNumber, utils } from 'ethers'

import type {
  IEntry,
  IBatchEntry,
  IRound,
  IEliminator,
  ContractModeParams,
} from '../types/spin.types'
import type { FareToken, FareSpin, EntryStructOutput, EliminatorStructOutput } from '../types'
import { BNToNumber } from '../utils'

import { ContractModes } from '../constants'
import config from '../../config/crypto.config'

class FareSpinAPI {
  public token!: FareToken
  public contract!: FareSpin
  private _rewardsAddress = config.rewardsAddress
  private _contractModes = ContractModes

  constructor(fareTokenContract: FareToken, fareSpinContract: FareSpin) {
    this.token = fareTokenContract
    this.contract = fareSpinContract
  }

  public get rewardsAddress() {
    return this._rewardsAddress
  }

  public get contractModes() {
    return this._contractModes
  }

  public getAddress(): string {
    return this.contract.address
  }

  public async getByteCode(): Promise<string> {
    return this.contract.provider.getCode(this.getAddress())
  }

  public getContractModeById(id: number): ContractModeParams {
    return this.contractModes.filter(gm => BNToNumber(gm.id) === id)[0]
  }

  public async getAllContractModes(): Promise<ContractModeParams[]> {
    const currentContractModeId = BNToNumber(await this.contract.getCurrentContractModeId())
    const contractModeIds = [...Array(currentContractModeId).keys()]

    const promiseList = contractModeIds.map(id => this.contract.contractModes(id))

    return Promise.all(promiseList)
  }

  public async getCurrentRoundId(): Promise<number> {
    const currentRoundId = (await this.contract.getCurrentRoundId()).toNumber()

    return currentRoundId
  }

  public async getRound(roundId: number): Promise<IRound> {
    const roundInfo = await this.contract.rounds(roundId)

    return {
      id: BNToNumber(roundInfo.id),
      randomNum: BNToNumber(roundInfo.randomNum),
      randomEliminator: BNToNumber(roundInfo.randomEliminator),
      fullRandomNum: utils.formatUnits(roundInfo.fullRandomNum, 0),
      randomHash: roundInfo.randomHash,
      revealKey: roundInfo.revealKey,
      startedAt: BNToNumber(roundInfo.startedAt),
      endedAt: BNToNumber(roundInfo.endedAt),
    }
  }

  public async getAllRounds(): Promise<IRound[]> {
    const roundIds = [...Array(await this.getCurrentRoundId()).keys()]
    const promiseList = roundIds.map(id => this.getRound(id))

    return Promise.all(promiseList)
  }

  public parseEliminator(eliminator: EliminatorStructOutput): IEliminator {
    return {
      contractModeId: BNToNumber(eliminator.contractModeId),
      recordedExpectedValueFloor: BNToNumber(eliminator.recordedExpectedValueFloor),
      isEliminator: eliminator.isEliminator,
    }
  }

  public async getAllEliminatorsByRound(roundId: number): Promise<IEliminator[]> {
    const eliminators = await this.contract.getEliminatorsByRoundId(roundId)

    return eliminators.map(elim => this.parseEliminator(elim))
  }

  public async getRoundRandomHash(roundId: BigNumber | number): Promise<string> {
    const randomHash = await this.contract.randomHashMap(roundId)
    return utils.formatUnits(randomHash, 0)
  }

  public parseEntry(entry: EntryStructOutput): IEntry {
    return {
      contractModeId: BNToNumber(entry.contractModeId),
      amount: BNToNumber(entry.amount, 18),
      pickedNumber: BNToNumber(entry.pickedNumber),
    }
  }

  public async getAllEntries(roundId: BigNumber | number, player: string): Promise<IEntry[]> {
    const bcEntries = await this.contract.getEntriesByRoundUser(roundId, player)

    const entries = bcEntries.map(entry => {
      return this.parseEntry(entry)
    })

    return entries
  }

  public async getBatchEntry(roundId: number, player: string): Promise<IBatchEntry> {
    const _batchEntry = await this.contract.batchEntryMap(roundId, player)

    return {
      player: _batchEntry.user,
      settled: _batchEntry.settled,
      totalEntryAmount: BNToNumber(_batchEntry.totalEntryAmount, 18),
      totalMintAmount: BNToNumber(_batchEntry.totalMintAmount, 18),
    }
  }

  public async getAllBatchEntries(
    roundId: number,
    includeEntries = true
  ): Promise<{
    batchEntries: IBatchEntry[]
    totalRoundEntryAmount: number
    totalRoundMintAmount: number
  }> {
    let totalRoundEntryAmount = 0
    let totalRoundMintAmount = 0

    const players = await this.contract.getAllUsersByRoundId(roundId)

    const promiseList = players.map((player): Promise<IBatchEntry> => {
      return new Promise((resolve, reject) => {
        this.getBatchEntry(roundId, player)
          .then(batchEntry => {
            totalRoundEntryAmount += batchEntry.totalEntryAmount
            totalRoundMintAmount += batchEntry.totalMintAmount
            if (includeEntries) {
              this.getAllEntries(roundId, player)
                .then(entries => {
                  const BEWithEntries: IBatchEntry = Object.assign(batchEntry, {
                    entries,
                  })
                  resolve(BEWithEntries)
                })
                .catch(reject)
            } else {
              resolve(batchEntry)
            }
          })
          .catch(reject)
      })
    })

    const batchEntries = await Promise.all(promiseList)

    return {
      batchEntries,
      totalRoundEntryAmount,
      totalRoundMintAmount,
    }
  }
}

export default FareSpinAPI
