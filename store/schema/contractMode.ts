import { Entity, Schema } from 'redis-om'
import type { BigNumber } from 'ethers'

import type { Overwrite } from '../types'
import { bnify } from '../utils'

export interface ContractMode {
  jobId: string
  eventLogId: string
  id: number
  cardinality: number
  mintMultiplier: number
  contractExpectedValueFloor: string
  minAmount: string
  maxAmount: string
  entryLimit: number
  isActive: boolean
  timestamp: number
}

export interface BNGameMode
  extends Overwrite<
    ContractMode,
    {
      bn: {
        cardinality: BigNumber
        mintMultiplier: BigNumber
        contractExpectedValueFloor: BigNumber
        minAmount: BigNumber
        maxAmount: BigNumber
      }
    }
  > {}

export class ContractMode extends Entity {
  public ethFields = [
    'cardinality',
    'mintMultiplier',
    'contractExpectedValueFloor',
    'minAmount',
    'maxAmount',
  ]

  public bnify(): BNGameMode & Entity {
    return bnify(this)
  }
}

export default new Schema(
  ContractMode,
  {
    jobId: { type: 'string' },
    eventLogId: { type: 'string' },
    id: { type: 'number' },
    cardinality: { type: 'number' },
    contractExpectedValueFloor: { type: 'string' },
    mintMultiplier: { type: 'number' },
    minAmount: { type: 'string' },
    maxAmount: { type: 'string' },
    entryLimit: { type: 'number' },
    isActive: { type: 'boolean' },
    timestamp: { type: 'date' },
  },
  { dataStructure: 'JSON' }
)
