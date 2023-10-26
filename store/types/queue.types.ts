import { ContractNames } from '../constants'

export interface IEventLogQueue {
  contractName: ContractNames
  blockNumber: number
  transactionHash: string
  logIndex: number
  event: string
  topics: string[]
  timestamp: number
}

export interface IFareTransferQueue {
  from: string
  to: string
  amount: string
  timestamp: number
  event: IEventLogQueue
}

export interface IContractModeUpdatedQueue {
  contractModeId: number
  timestamp: number
  event: IEventLogQueue
}

export interface IEntrySubmittedQueue {
  roundId: number
  batchEntryId: number
  player: string
  timestamp: number
  placedAt: number
  txHash: string
  event: IEventLogQueue
}

export interface IRoundConcludedQueue {
  endedTxHash: string
  roundId: number
  fullRandomNum: string
  revealKey: string
  randomNum: number
  randomEliminator: string
  timestamp: number
  endedAt: number
  event: IEventLogQueue
}

export interface IEntrySettledQueue {
  settledTxHash: string
  roundId: number
  player: string
  hasWon: boolean
  timestamp: number
  settledAt: number
  event: IEventLogQueue
}

export interface IBatchEntriesSettledQueue {
  settledTxHash: string
  player: string
  roundIds: number[]
  timestamp: number
  settledAt: number
  event: IEventLogQueue
}

export interface INewRoundStartedQueue {
  startedTxHash: string
  roundId: number
  randomHash: string
  startedAt: number
  timestamp: number
  event: IEventLogQueue
}

export interface IBatchEntryWithdrawQueue {
  roundId: number
  player: string
  txHash: string
  withdrewAt: number
  timestamp: number
  event: IEventLogQueue
}
