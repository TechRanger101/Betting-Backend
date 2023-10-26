import { Entity, Schema } from 'redis-om'

export interface ChatMessage {
  id: string // Random id (shortId)
  text: string // @NOTE: May need to do parsing to handle emojis
  createdBy: string // User's public address
  username: string // User's username
  timestamp: number // Unix timestamp
}

export class ChatMessage extends Entity {}

export default new Schema(
  ChatMessage,
  {
    id: { type: 'string' },
    text: { type: 'string' },
    createdBy: { type: 'string' },
    username: { type: 'string' },
    timestamp: { type: 'date', sortable: true },
  },
  { dataStructure: 'JSON' }
)
