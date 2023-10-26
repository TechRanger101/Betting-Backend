import type {
  IServiceObj,
  IContractModeUpdatedQueue,
  IEntrySubmittedQueue,
  IEntrySettledQueue,
  IRoundConcludedQueue,
  EventReturnData,
  IBatchEntriesSettledQueue,
  INewRoundStartedQueue,
} from '../../types'

import type { IRoundEliminators } from '../../../pubsub/types'
import PubSub from '../../../pubsub'
import { ContractNames, EventNames } from '../../constants'
import { spinAPI } from '../../../crypto'
import { formatETH, toEth, workerLogger as logger } from '../../utils'

let startedAtHashTx = ''

const createSpinJobProcesses = (service: IServiceObj) => {
  async function contractModeUpdated<T>(
    queueData: IContractModeUpdatedQueue,
    jobId: string = null
  ) {
    const { event, contractModeId, timestamp } = queueData

    const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    if (!eventLogId) return null

    const data = (
      await service.contractMode.createOrUpdate(contractModeId, timestamp, eventLogId, jobId)
    ).toRedisJson()

    // @NOTE: May need to publish here

    return JSON.stringify({
      eventName: EventNames.ContractModeUpdated,
      data,
    } as EventReturnData<T>)
  }

  async function entrySubmitted(queueData: IEntrySubmittedQueue, jobId: string = null) {
    const { roundId, placedAt, batchEntryId, player, event, timestamp, txHash } = queueData
    const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    if (!eventLogId) return null

    const data = await service.batchEntry.create(
      eventLogId,
      roundId,
      batchEntryId,
      player,
      placedAt,
      txHash,
      jobId,
      timestamp
    )

    PubSub.pub<'batch-entry'>('spin-state', 'batch-entry', {
      batchEntry: data.batchEntry as any,
      entries: data.entries,
    })

    return JSON.stringify({
      eventName: EventNames.EntrySubmitted,
      data,
    } as EventReturnData<typeof data>)
  }

  async function roundConcluded<T>(queueData: IRoundConcludedQueue, jobId: string = null) {
    const {
      endedAt,
      roundId,
      fullRandomNum,
      revealKey,
      randomNum,
      randomEliminator,
      event,
      timestamp,
      endedTxHash,
    } = queueData
    logger.info(`Concluded round: ${roundId}`)

    const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    if (!eventLogId) return null

    const settledData = await service.round.updateRoundBatchEntries(
      roundId,
      randomNum,
      randomEliminator
    )

    // Get and set eliminator data from blockchain
    const roundEliminators = await service.eliminator.createEliminatorsByRoundId(
      jobId,
      eventLogId,
      roundId,
      timestamp
    )

    const eliminators: IRoundEliminators = {
      isTwoXElim: false,
      isTenXElim: false,
      isHundoXElim: false,
    }

    roundEliminators.forEach(({ contractModeId, isEliminator }) => {
      switch (contractModeId) {
        case 0:
          eliminators.isTwoXElim = isEliminator
          break
        case 1:
          eliminators.isTenXElim = isEliminator
          break
        case 2:
          eliminators.isHundoXElim = isEliminator
          break

        default:
          break
      }
      eliminators[contractModeId] = isEliminator
    })

    const { randomHash, startedAt } = await spinAPI.getRound(roundId)

    PubSub.pub<'round-concluded'>('spin-state', 'round-concluded', {
      roundId,
      randomNum,
      randomEliminator,
      randomHash,
      revealKey,
      fullRandomNum,
      settledData,
      startedAt,
      endedAt,
      // startedTxHash: round.startedTxHash,
      startedTxHash: startedAtHashTx,
      endedTxHash,
      ...eliminators,
    })

    // Increment cached roundId in Redis
    await service.round.updateCurrentRoundId((roundId + 1).toString())

    const roundData = await service.round.repo.search().where('roundId').eq(roundId).returnFirst()

    roundData.eventLogId = eventLogId
    roundData.roundId = roundId
    roundData.randomNum = randomNum
    roundData.randomEliminator = randomEliminator
    roundData.randomHash = randomHash
    roundData.revealKey = revealKey
    roundData.fullRandomNum = fullRandomNum
    roundData.startedAt = startedAt
    roundData.endedAt = endedAt
    roundData.timestamp = timestamp
    roundData.startedTxHash = startedAtHashTx
    roundData.jobId = jobId
    roundData.endedTxHash = endedTxHash

    service.round.repo.save(roundData)

    const data = roundData.toRedisJson()

    return JSON.stringify({
      eventName: EventNames.RoundConcluded,
      data,
    } as EventReturnData<T>)
  }

  async function entrySettled<T>(queueData: IEntrySettledQueue, jobId: string = null) {
    const { settledTxHash, roundId, player, hasWon, event, timestamp } = queueData

    const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    if (!eventLogId) return null

    // const [_entryId, _player, _settled, _totalEntryAmount, _totalMintAmount] =
    const { settledAt, totalMintAmount } = await spinAPI.contract.batchEntryMap(roundId, player)
    const batchEntryEntity = await service.batchEntry.settle(
      roundId,
      player,
      settledAt.toNumber(),
      settledTxHash,
      jobId,
      timestamp
    )

    // @NOTE: Ensure blockchain totalMintAmount and calculated Redis totalMintAmount is correct
    // @NOTE: We need to log to our analytics if these numbers do not match
    if (hasWon && !toEth(batchEntryEntity.totalMintAmount).eq(totalMintAmount)) {
      logger.warn('------------------------------------------')
      logger.warn(
        '!IMPORTANT - Redis totalMintAmount and smart contract totalMintAmount do not match.'
      )
      logger.warn('If you see this error report steps to reproduce!')
      logger.warn('Updating to reflect the amount fetched from the blockchain...')
      logger.warn('------------------------------------------')
      batchEntryEntity.totalMintAmount = formatETH(totalMintAmount)
      await service.batchEntry.repo.save(batchEntryEntity)
    }

    // @NOTE: Need to include updated entry values as well
    return JSON.stringify({
      eventName: EventNames.EntrySettled,
      data: batchEntryEntity.toRedisJson(),
    } as EventReturnData<T>)
  }

  async function batchEntrySettler(
    roundId: number,
    player: string,
    timestamp: number,
    settledTxHash: string,
    jobId: string = null
  ) {
    // const [_entryId, _player, _settled, _totalEntryAmount, _totalMintAmount] =
    const { settledAt, totalMintAmount } = await spinAPI.contract.batchEntryMap(roundId, player)

    const batchEntryEntity = await service.batchEntry.settle(
      roundId,
      player,
      settledAt.toNumber(),
      settledTxHash,
      jobId,
      timestamp
    )

    // @NOTE: Ensure blockchain totalMintAmount and calculated Redis totalMintAmount is correct
    // @NOTE: We need to log to our analytics if these numbers do not match
    if (!toEth(batchEntryEntity.totalMintAmount).eq(totalMintAmount)) {
      logger.warn('------------------------------------------')
      logger.warn(
        '!IMPORTANT - Redis totalMintAmount and smart contract totalMintAmount do not match.'
      )
      logger.warn('If you see this error report steps to reproduce!')
      logger.warn('Updating to reflect the amount fetched from the blockchain...')
      logger.warn('PLAYER ADDRESS:', batchEntryEntity)
      logger.warn(
        `REDIS TOTAL MINT AMOUNT:${
          batchEntryEntity.totalMintAmount
        } || ACTUAL TOTAL MINT AMOUNT: ${totalMintAmount.toString()}`
      )
      logger.warn('------------------------------------------')
      batchEntryEntity.totalMintAmount = formatETH(totalMintAmount)
      await service.batchEntry.repo.save(batchEntryEntity)
    }
  }

  async function batchEntriesSettled(queueData: IBatchEntriesSettledQueue, jobId: string = null) {
    const { settledTxHash, roundIds, player, event, timestamp } = queueData

    const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    if (!eventLogId) return null

    const promiseList = roundIds.map(rid =>
      batchEntrySettler(rid, player, timestamp, settledTxHash, jobId)
    )

    await Promise.all(promiseList)
  }

  async function newRoundStarted(queueData: INewRoundStartedQueue, _jobId: string = null) {
    const {
      startedTxHash,
      roundId,
      startedAt,
      randomHash,
      event: _event,
      timestamp: _timestamp,
    } = queueData

    startedAtHashTx = startedTxHash

    // const eventLogId = await service.eventLog.process(event, ContractNames.FareSpin)
    // if (!eventLogId) return null

    await service.round.repo.createAndSave({
      // eventLogId,
      // jobId: _jobId,
      roundId,
      randomHash,
      startedAt,
      startedTxHash,
    })

    await PubSub.pub<'new-round-started'>('spin-state', 'new-round-started', {
      startedAt,
      randomHash,
      roundId,
    })
  }

  return {
    contractModeUpdated,
    entrySubmitted,
    entrySettled,
    roundConcluded,
    batchEntriesSettled,
    newRoundStarted,
  }
}

export default createSpinJobProcesses
