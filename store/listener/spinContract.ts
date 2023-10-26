import type { BigNumber, Event } from 'ethers'

import type { StoreQueue } from '../queue'
import {
  type IServiceObj,
  type IContractModeUpdatedQueue,
  type IEntrySubmittedQueue,
  type IEntrySettledQueue,
  type IRoundConcludedQueue,
  type IBatchEntriesSettledQueue,
  type INewRoundStartedQueue,
  type IBatchEntryWithdrawQueue,
} from '../types'
import { BNToNumber, formatBN } from '../utils'
import { EventNames, ContractNames } from '../constants'
import PubSub from '../../pubsub'

const createSpinContractListener = (service: IServiceObj, storeQueue: StoreQueue) => {
  const { eventLog } = service

  const contractModeUpdated = async (contractModeId: BigNumber, event: Event) => {
    const queueData: IContractModeUpdatedQueue = {
      contractModeId: BNToNumber(contractModeId),
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
    }
    await storeQueue.spinContract.add(EventNames.ContractModeUpdated, queueData)
  }

  const entrySubmitted = async (
    _roundId: BigNumber,
    _batchEntryId: BigNumber,
    player: string,
    event: Event
  ) => {
    const block = await event.getBlock()
    const batchEntryId = BNToNumber(_batchEntryId)
    const roundId = BNToNumber(_roundId)

    // Pub to SpinRoom know when first batch entry is submitted
    if (batchEntryId === 0) {
      PubSub.pub<'current-round-first-batch-entry'>(
        'spin-state',
        'current-round-first-batch-entry',
        roundId
      )
    }

    const queueData: IEntrySubmittedQueue = {
      txHash: event.transactionHash,
      roundId,
      batchEntryId,
      player,
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
      placedAt: block.timestamp,
    }

    await storeQueue.spinContract.add(EventNames.EntrySubmitted, queueData)
  }

  const roundConcluded = async (
    roundId: BigNumber,
    revealKey: string,
    fullRandomNumber: BigNumber,
    randomNum: BigNumber,
    randomEliminator: BigNumber,
    event: Event
  ) => {
    const block = await event.getBlock()

    const queueData: IRoundConcludedQueue = {
      endedTxHash: event.transactionHash,
      roundId: BNToNumber(roundId),
      revealKey,
      fullRandomNum: formatBN(fullRandomNumber, 0),
      randomNum: BNToNumber(randomNum),
      randomEliminator: formatBN(randomEliminator, 0),
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
      endedAt: block.timestamp,
    }

    await storeQueue.spinContract.add(EventNames.RoundConcluded, queueData)
  }

  const entrySettled = async (
    roundId: BigNumber,
    player: string,
    hasWon: boolean,
    event: Event
  ) => {
    const block = await event.getBlock()

    const queueData: IEntrySettledQueue = {
      settledTxHash: event.transactionHash,
      roundId: BNToNumber(roundId),
      player,
      hasWon,
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
      settledAt: block.timestamp,
    }

    await storeQueue.spinContract.add(EventNames.EntrySettled, queueData)
  }

  // @NOTE: Probably don't need to send this to a worker since it's less frequently called
  const roundPausedChanged = async (isPaused: boolean) => {
    await PubSub.pub<'spin-round-pause'>('spin-state', 'spin-round-pause', {
      isPaused,
      countdown: await service.round.getSpinCountdownTimer(),
    })
    await service.round.setSpinRoundPaused(isPaused)
  }

  const batchEntriesSettled = async (player: string, roundIds: BigNumber[], event: Event) => {
    const block = await event.getBlock()

    const roundIdsNum = roundIds.map(val => BNToNumber(val))
    const queueData: IBatchEntriesSettledQueue = {
      settledTxHash: event.transactionHash,
      roundIds: roundIdsNum,
      player,
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
      settledAt: block.timestamp,
    }

    await storeQueue.spinContract.add(EventNames.BatchEntriesSettled, queueData)
  }

  const newRoundStarted = async (
    roundId: BigNumber,
    randomHash: string,
    startedAt: BigNumber,
    event: Event
  ) => {
    const queueData: INewRoundStartedQueue = {
      startedTxHash: event.transactionHash,
      roundId: BNToNumber(roundId),
      randomHash,
      startedAt: BNToNumber(startedAt),
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
      timestamp: Date.now(),
    }

    await storeQueue.spinContract.add(EventNames.NewRoundStarted, queueData)
  }

  const batchEntryWithdraw = async (roundId: BigNumber, player: string, event: Event) => {
    const block = await event.getBlock()

    const queueData: IBatchEntryWithdrawQueue = {
      txHash: event.transactionHash,
      roundId: BNToNumber(roundId),
      player,
      withdrewAt: block.timestamp,
      timestamp: Date.now(),
      event: eventLog.parseForQueue(event, ContractNames.FareSpin),
    }

    await storeQueue.spinContract.add(EventNames.BatchEntryWithdraw, queueData)
  }

  return {
    contractModeUpdated,
    entrySubmitted,
    roundConcluded,
    entrySettled,
    roundPausedChanged,
    batchEntriesSettled,
    newRoundStarted,
    batchEntryWithdraw,
  }
}

export default createSpinContractListener
