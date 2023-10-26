import { Entity, Schema } from 'redis-om'

export enum RandomTag {
  Spin = 'Spin',
}

export interface Randomness {
  roundId: number
  randomHash: string
  revealKey: string
  fullRandomNum: string
  timestamp: number
  tag: RandomTag
}

export class Randomness extends Entity {}

export default new Schema(
  Randomness,
  {
    roundId: { type: 'number' },
    randomHash: { type: 'string' },
    fullRandomNum: { type: 'string' },
    revealKey: { type: 'string' },
    timestamp: { type: 'number' },
    tag: { type: 'string' },
  },
  { dataStructure: 'JSON' }
)
