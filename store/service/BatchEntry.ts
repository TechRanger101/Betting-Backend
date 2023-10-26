import type { BigNumber } from 'ethers'

import type EntryService from './Entry'
import type { BatchEntry } from '../schema/types'
import type { IBatchEntry, IEntry } from '../../pear/entities'

import ServiceBase from './ServiceBase'
import { ensureNumber, formatETH, logger } from '../utils'
import { spinAPI } from '../../crypto'

interface ICurrentBatchEntries {
  batchEntry: IBatchEntry
  entries: IEntry[]
}

export default class BatchEntryService extends ServiceBase<BatchEntry> {
  entryService!: EntryService

  constructor(entryService: EntryService) {
    super()

    this.entryService = entryService
  }

  public fetch(roundId: BigNumber | number, player: string) {
    return this.repo
      .search()
      .where('roundId')
      .equal(ensureNumber(roundId))
      .where('player')
      .equal(player)
      .returnFirst()
  }

  public fetchBatchEntriesByRoundId(roundId: number) {
    return this.repo.search().where('roundId').equal(roundId).sortAsc('batchEntryId').returnAll()
  }

  public async fetchClaimableRewards(publicAddress: string) {
    let records = await this.repo
      .search()
      .where('player')
      .eq(publicAddress)
      .and('settled')
      .eq(false)
      .returnAll()

    records = records.filter(record => Number(record.totalMintAmount))

    return records
  }

  public async getCurrentRoundBatchEntries(): Promise<ICurrentBatchEntries[]> {
    const currentRoundId = await spinAPI.getCurrentRoundId()
    const batchEntries = await this.fetchBatchEntriesByRoundId(currentRoundId)

    const promiseList: Promise<ICurrentBatchEntries>[] = batchEntries.map(be => {
      return new Promise((resolve, reject) => {
        this.entryService
          .fetchEntriesByRoundPlayer(be.roundId, be.player)
          .then(entries => {
            resolve({
              batchEntry: be.toRedisJson() as IBatchEntry,
              entries: entries.map(entry => entry.toRedisJson()) as IEntry[],
            })
          })
          .catch(reject)
      })
    })

    return Promise.all(promiseList)
  }

  public async create(
    eventLogId: string,
    roundId: number,
    batchEntryId: number,
    player: string,
    placedAt: number,
    placedTxHash: string,
    jobId: string = null,
    timestamp = Date.now()
  ) {
    const entries = await this.entryService.populateEntriesFromBatchEntryId(
      eventLogId,
      roundId,
      player,
      jobId,
      timestamp
    )

    const be = await spinAPI.contract.batchEntryMap(roundId, player)
    const { settled, totalEntryAmount, totalMintAmount } = be

    const batchEntry = {
      eventLogId,
      roundId,
      batchEntryId,
      settled,
      player,
      placedAt,
      totalEntryAmount: formatETH(totalEntryAmount),
      totalMintAmount: formatETH(totalMintAmount),
      timestamp,
      jobId,
      placedTxHash,
    }

    await this.repo.createAndSave(batchEntry)

    return {
      batchEntry,
      entries,
    }
  }

  public async settle(
    roundId: number,
    player: string,
    settledAt: number,
    settledTxHash: string,
    jobId: string = null,
    settledOn = Date.now()
  ) {
    const batchEntryEntity = await this.fetch(roundId, player)

    // @NOTE: BULLMQ
    if (!batchEntryEntity) {
      // @NOTE: Push to queue to wait retry again in 10 seconds.
      // @NOTE: Problem occurs because settleBatchEntry and entrySubmitted even are fired off on connection
      logger.warn(
        '@NOTE: NEED TO RACE CONDITION TO CREATE BATCH ENTRY AND ENTRIES SINCE IT IS NULL!!!'
      )
    }

    batchEntryEntity.settled = true
    batchEntryEntity.settledOn = settledOn
    batchEntryEntity.settledAt = settledAt
    batchEntryEntity.jobId = jobId
    batchEntryEntity.settledTxHash = settledTxHash

    const entries = await this.entryService.fetchEntriesByRoundPlayer(roundId, player)

    const promiseList = entries.map(entry => {
      return new Promise((resolve, reject) => {
        entry.settled = true
        entry.settledOn = settledAt
        entry.jobId = jobId
        this.entryService.repo.save(entry).then(resolve).catch(reject)
      })
    })

    await Promise.all(promiseList)
    await this.repo.save(batchEntryEntity)

    return batchEntryEntity
  }
}
