import { Entity, Schema } from 'redis-om'
import type { BigNumber } from 'ethers'

import type { Overwrite } from '../types'
import { bnify } from '../utils'

export interface BatchEntry {
  jobId: string
  eventLogId: string
  placedTxHash: string
  settledTxHash: string
  withdrawTxHash: string
  roundId: number
  batchEntryId: number
  player: string
  settled: boolean
  settledAt: number
  placedAt: number
  withdrewAt: number
  totalEntryAmount: string
  totalMintAmount: string
  timestamp: number
  settledOn: number
}

export interface BNBatchEntry
  extends Overwrite<
    BatchEntry,
    {
      bn: {
        totalEntryAmount: BigNumber
        totalMintAmount: BigNumber
      }
    }
  > {}

export class BatchEntry extends Entity {
  ethFields = ['totalEntryAmount', 'totalMintAmount']

  bnify(): BNBatchEntry & Entity {
    return bnify(this)
  }
}

export default new Schema(
  BatchEntry,
  {
    jobId: { type: 'string' },
    eventLogId: { type: 'string' },
    placedTxHash: { type: 'string' },
    settledTxHash: { type: 'string' },
    withdrawTxHash: { type: 'string' },
    roundId: { type: 'number' },
    batchEntryId: { type: 'number', sortable: true },
    player: { type: 'string' },
    settled: { type: 'boolean' },
    totalEntryAmount: { type: 'string' },
    totalMintAmount: { type: 'string' },
    timestamp: { type: 'date' },
    settledAt: { type: 'date' },
    placedAt: { type: 'date' },
    withdrewAt: { type: 'date' },
    settledOn: { type: 'date' },
  },
  { dataStructure: 'JSON' }
)
