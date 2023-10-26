import { type IBatchEntry, type IEntry, type IRound } from '../../pear/entities'
import { type Omit, type SpinRoomStatus } from '../../store/types'
import { type ContractMode } from '../../store/schema/types'

export type ChannelName = 'fare' | 'spin-state' | 'analytics' | 'user-update'

export type BatchEntryMsgArgs = {
  batchEntry: Omit<IBatchEntry, 'entries' | 'isBurn'>
  entries: Omit<IEntry, 'isBurn'>[]
}

export type SettledEntry = {
  mintAmount?: string
  roundId: number
  player: string
}

export type SettledBatchEntry = {
  batchEntryId: number
  player: string // Public address of player
  totalMintAmount?: string // Amount(sum of all minting entries) won when round is over
}

export type SettledBatchEntryArgs = {
  batchEntry: SettledBatchEntry
  entries: SettledEntry[]
}

export type FareTransferArgs = {
  to: string
  from: string
  amount: string
  timestamp: number
}

export interface IRoundEliminators {
  isTwoXElim: boolean
  isTenXElim: boolean
  isHundoXElim: boolean
}

export interface INewRoundStarted {
  startedAt: number
  randomHash: string
  roundId: number
}

export interface IRoundFinished {
  endedAt: number
  randomNum: number
}

export interface IUsernameChanged {
  publicAddress: string
  username: string
}

export type SettledRound = {
  settledData: SettledBatchEntryArgs[]
} & Omit<IRound, 'isEliminator'> &
  IRoundEliminators

export type ContractModeArgs = Omit<ContractMode, 'jobId' | 'eventLogId' | 'timestamp'>

export interface MessageListener {
  'fare-total-supply-updated': (totalSupply: { totalSupply: string }, ...args: any[]) => void
  'fare-transfer': (transfer: FareTransferArgs, ...args: any[]) => void
  'contract-mode-updated': (contractModes: ContractModeArgs[], ...args: any[]) => void
  'batch-entry': (opts: BatchEntryMsgArgs, ...args: any[]) => void
  'round-concluded': (round: SettledRound, ...args: any[]) => void
  'new-round-started': (round: INewRoundStarted, ...args: any[]) => void
  'batch-entry-settled': (settledData: SettledBatchEntryArgs, ...args: any[]) => void
  'start-round': (roundId: number, ...args: any[]) => void
  'round-finished': (opts: IRoundFinished, ...args: any[]) => void
  'countdown-updated': (countdown: number, ...args: any[]) => void
  'spin-round-pause': (opts: { isPaused: boolean; countdown: number }, ...args: any[]) => void
  'spin-room-status': (
    opts: { status: SpinRoomStatus; targetTick?: number; totalCountdown?: number },
    ...args: any[]
  ) => void
  'reset-spin-round': (opts: { message: string }, ...args: any[]) => void
  'username-changed': (opts: IUsernameChanged, ...args: any[]) => void
  'current-round-first-batch-entry': (opts: number, ...args: any[]) => void
}

export type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any
