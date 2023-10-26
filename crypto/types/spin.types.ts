import { type BigNumber, type ContractReceipt, type ContractTransaction } from 'ethers'

export type ContractModeParams = {
  id: BigNumber
  cardinality: BigNumber
  mintMultiplier: BigNumber
  contractExpectedValueFloor: BigNumber
  minAmount: BigNumber
  maxAmount: BigNumber
  entryLimit: BigNumber
  isActive: boolean
}

export interface ContractMode {
  id: number
  cardinality: number
  mintMultiplier: number
  minAmount: number
  contractExpectedValueFloor: BigNumber
  maxAmount: number
  entryLimit: number
  isActive: boolean
}

export interface IContractModesTx {
  tx: ContractTransaction
  contractMode: ContractMode
}

export interface IBatchEntryItem {
  amount: BigNumber
  contractModeId: string
  pickedNumber: string
}

export interface IBatchEntryTx {
  tx: ContractTransaction
  receipt: ContractReceipt | null
  entries: IBatchEntryItem[]
  totalEntryAmount: number
}

export interface IConcludeRoundResp {
  currentRoundId: number
  tx: ContractTransaction
  receipt?: ContractReceipt | null
}

export interface IEntry {
  amount: number
  contractModeId: number
  pickedNumber: number
}

export interface IBatchEntry {
  player: string
  settled: boolean
  totalEntryAmount: number
  totalMintAmount: number
  entries?: IEntry[]
}

export interface IRound {
  id: number
  randomNum: number
  randomHash: string
  revealKey: string
  fullRandomNum: string
  startedAt: number
  endedAt: number
  eliminatorContractMode?: [{ [contractModeId: string]: boolean }]
  randomEliminator?: number
}

export interface IEliminator {
  contractModeId: number
  recordedExpectedValueFloor: number
  isEliminator: boolean
}

export interface IEliminatorMap {
  [contractModeId: string]: IEliminator[]
}

export interface IBreakDown {
  totalRoundMintAmount: number
  totalRoundEntryAmount: number
  totalRoundSupply: number
  totalDeltaAmount: number
  totalRakeAmount: number
}

export interface IRoundBreakdown {
  info: IRound
  breakdown: IBreakDown
  batchEntries: IBatchEntry[]
}

export interface ISpinSimulationOptions {
  roundCount: number
  entryCount: number
  batchRange: number[]
  amountRange: number[]
  fixedAmount?: number | null
}

export interface IEntryIds {
  roundId: number
  entryId: number
  contractModeId?: number
}

export interface Entry {
  player: string
  contractModeId: string
  roundId: string
  entryId: string
  pickedNumber: string
  amount: string
  mintAmount: string
  settled: boolean
  result: string
}

export type EntryStructOutput = [BigNumber, BigNumber, BigNumber] & {
  amount: BigNumber
  contractModeId: BigNumber
  pickedNumber: BigNumber
}

export type EliminatorStructOutput = [BigNumber, BigNumber, boolean] & {
  contractModeId: BigNumber
  recordedExpectedValueFloor: BigNumber
  isEliminator: boolean
}

export type FareSpinContractState =
  | 'should-pause-and-end-round'
  | 'should-end-prev-round'
  | 'should-start-round'
  | 'should-unpause-round'
