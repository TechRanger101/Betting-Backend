import type { BigNumber } from 'ethers'

import type EntryService from './Entry'
import type BatchEntryService from './BatchEntry'
import type ContractModeService from './ContractMode'
import type { Round, BNGameMode } from '../schema/types'
import type { SettledBatchEntryArgs, SettledBatchEntry, SettledEntry } from '../../pubsub/types'

import ServiceBase from './ServiceBase'
import { ensureNumber, formatETH, BN, toEth, logger } from '../utils'
import { spinAPI } from '../../crypto'
import { GlobalRedisKey } from '../constants'
import { type SpinRoomStatus } from '../types'
import PubSub from '../../pubsub'

export default class RoundService extends ServiceBase<Round> {
  ContractModeService!: ContractModeService
  batchEntryService!: BatchEntryService
  entryService!: EntryService

  constructor(
    ContractModeService: ContractModeService,
    batchEntryService: BatchEntryService,
    entryService: EntryService
  ) {
    super()

    this.batchEntryService = batchEntryService
    this.entryService = entryService
    this.ContractModeService = ContractModeService
  }

  public fetch(roundId: BigNumber | number) {
    return this.repo.search().where('roundId').equal(ensureNumber(roundId)).returnFirst()
  }

  public async updateCurrentRoundId(_currentRoundId?: string) {
    let currentRoundId = _currentRoundId
    if (!currentRoundId) {
      currentRoundId = (await spinAPI.getCurrentRoundId()).toString()
    }
    await this.client.set(`Global:${GlobalRedisKey.CurrentRoundId}`, currentRoundId)

    return currentRoundId
  }

  public async getCachedCurrentRoundId() {
    return this.client.get(`Global:${GlobalRedisKey.CurrentRoundId}`)
  }

  public async ensureSpinRoundPaused() {
    const isPaused = await spinAPI.contract.isRoundPaused()
    this.client.set(`Global:${GlobalRedisKey.IsSpinRoundPaused}`, String(isPaused))
    return isPaused
  }

  public async setSpinRoundPaused(isPaused: boolean) {
    return this.client.set(`Global:${GlobalRedisKey.IsSpinRoundPaused}`, String(isPaused))
  }

  public async getCachedSpinRoundPaused() {
    const isPaused = await this.client.get(`Global:${GlobalRedisKey.IsSpinRoundPaused}`)
    return isPaused === 'true'
  }

  public async setSpinCountdownTimer(time: number) {
    PubSub.pub('spin-state', 'countdown-updated', time)
    return this.client.set(`Global:${GlobalRedisKey.SpinCountdownTimer}`, String(time))
  }

  public async getSpinCountdownTimer() {
    const countdown = Number(await this.client.get(`Global:${GlobalRedisKey.SpinCountdownTimer}`))
    return countdown
  }

  public async setSpinRoomStatus(
    status: SpinRoomStatus,
    targetTick?: number,
    totalCountdown?: number
  ) {
    PubSub.pub<'spin-room-status'>('spin-state', 'spin-room-status', {
      status,
      targetTick,
      totalCountdown,
    })
    return this.client.set(`Global:${GlobalRedisKey.SpinRoomStatus}`, status)
  }

  public async resetFareSpinStateRound(message = 'Resetting round') {
    await PubSub.pub<'reset-spin-round'>('spin-state', 'reset-spin-round', { message })
  }

  public async getSpinRoomStatus() {
    return this.client.get(`Global:${GlobalRedisKey.SpinRoomStatus}`)
  }

  public async getPlayerCountByRound(_roundId?: number) {
    let roundId = _roundId || (await this.getCachedCurrentRoundId())

    return this.batchEntryService.repo.search().where('roundId').eq(roundId).returnCount()
  }

  // Calculates minters and burners from randomNum/randomEliminator by round
  public async updateRoundBatchEntries(
    roundId: number,
    _randomNum: number,
    _randomEliminator: string
  ) {
    const randomNum = BN(_randomNum)
    const randomEliminator = BN(_randomEliminator)

    const batchEntries = await this.batchEntryService.repo
      .search()
      .where('roundId')
      .eq(roundId)
      .returnAll()

    const contractModes = await this.ContractModeService.getActiveGameModes()

    const gameModeMap: { [key: number]: BNGameMode } = {}
    contractModes.forEach(gm => {
      gameModeMap[gm.id] = gm.bnify()
    })

    const fetchAllEntries = batchEntries.map(async batchEntry => {
      const obj = {
        batchEntry,
        entries: await this.entryService.repo
          .search()
          .where('roundId')
          .eq(batchEntry.roundId)
          .where('player')
          .eq(batchEntry.player)
          .sortAsc('entryIdx')
          .returnAll(),
      }

      return obj
    })

    const data = await Promise.all(fetchAllEntries)

    const promiseList: Promise<SettledBatchEntryArgs>[] = data.map(
      async ({ batchEntry, entries }) => {
        let totalMintAmount = BN('0')

        const entryPromise: Promise<SettledEntry>[] = entries.map(async entry => {
          const gm = gameModeMap[entry.contractModeId].bn

          if (BN(gm.contractExpectedValueFloor).lt(randomEliminator)) {
            // @NOTE: MINT NFT LOOTBOX (ONLY ONCE PER BATCH ENTRY)
            logger.warn('@NOTE: ELIMINATOR ROUND: NFT LOOTBOXES SHOULD BE MINTED')
          } else {
            let rng = randomNum
            // if (gm.cardinality.eq('10')) {
            //   rng = BN(Math.floor(rng.toNumber() / 10).toString())
            // }

            if (rng.mod(gm.cardinality).eq(entry.pickedNumber)) {
              entry.mintAmount = formatETH(gm.mintMultiplier.mul(toEth(entry.amount)))
              totalMintAmount = totalMintAmount.add(toEth(entry.mintAmount))
            }
          }
          await this.entryService.repo.save(entry)
          const { player, mintAmount, entryIdx } = entry
          return { player, roundId, mintAmount, entryIdx } as SettledEntry
        })

        const updatedEntries = await Promise.all(entryPromise)
        batchEntry.totalMintAmount = formatETH(totalMintAmount)
        await this.batchEntryService.repo.save(batchEntry)

        return {
          batchEntry: {
            totalMintAmount: batchEntry.totalMintAmount,
            roundId: batchEntry.roundId,
            player: batchEntry.player,
            batchEntryId: batchEntry.batchEntryId,
          } as SettledBatchEntry,
          entries: updatedEntries,
        }
      }
    )

    return Promise.all(promiseList)
  }
}
