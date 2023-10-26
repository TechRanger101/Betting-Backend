import { Entity, Schema } from 'redis-om'

export interface Eliminator {
  jobId: string
  eventLogId: string
  roundId: number
  contractModeId: number
  recordedExpectedValueFloor: string // gameModeFloor at the time of the round
  isEliminator: boolean
  timestamp: number
}

export class Eliminator extends Entity {}

export default new Schema(
  Eliminator,
  {
    jobId: { type: 'string' },
    eventLogId: { type: 'string' },
    roundId: { type: 'number' },
    contractModeId: { type: 'number' },
    recordedExpectedValueFloor: { type: 'string' },
    isEliminator: { type: 'boolean' },
    timestamp: { type: 'date' },
  },
  { dataStructure: 'JSON' }
)
