import { Entity, Schema } from 'redis-om'

export interface FareTransfer {
  jobId: string
  eventLogId: string
  from: string
  to: string
  amount: string
  transferType: string
  timestamp: number
}

export class FareTransfer extends Entity {}

export default new Schema(
  FareTransfer,
  {
    jobId: { type: 'string' },
    eventLogId: { type: 'string' },
    from: { type: 'string' },
    to: { type: 'string' },
    amount: { type: 'string' },
    transferType: { type: 'string' },
    timestamp: { type: 'date' },
  },
  { dataStructure: 'JSON' }
)
