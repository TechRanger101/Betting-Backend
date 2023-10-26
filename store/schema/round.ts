import { Entity, Schema } from 'redis-om'

export interface Round {
  eventLogId: string
  jobId: string
  randomEliminator: string
  randomNum: number
  roundId: number
  timestamp: number
  startedAt: number
  endedAt: number
  randomHash: string
  startedTxHash: string
  endedTxHash: string
  fullRandomNum: string
  revealKey: string
}

export class Round extends Entity {}

export default new Schema(
  Round,
  {
    eventLogId: { type: 'string' },
    jobId: { type: 'string' },
    randomEliminator: { type: 'string' },
    randomNum: { type: 'number' },
    roundId: { type: 'number' },
    timestamp: { type: 'date' },
    startedAt: { type: 'date' },
    endedAt: { type: 'date' },
    randomHash: { type: 'string' },
    startedTxHash: { type: 'string' },
    endedTxHash: { type: 'string' },
    fullRandomNum: { type: 'string' },
    revealKey: { type: 'string' },
  },
  { dataStructure: 'JSON' }
)
