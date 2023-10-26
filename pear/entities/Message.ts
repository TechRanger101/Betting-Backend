import { Schema, Context } from '@colyseus/schema'
import shortId from 'shortid'

import { IMessage } from './IMessage'

const type = Context.create()

export interface IMessageOpts {
  text: string
  createdBy: string
  username?: string
  colorTheme?: string
}

// @NOTE: Need to save message analytics
// - Message count and frequency by user
// - Number of messages with a user tagged
// - Players timed out for spamming messages
// - Timestamp and round ID data occured
export class Message extends Schema implements IMessage {
  @type('string') id: string
  @type('string') text: string
  @type('string') createdBy: string
  @type('string') username: string
  @type('string') colorTheme: string
  @type('string') timestamp: string
  @type('string') actorNumber: string

  constructor({ text, createdBy, username, colorTheme }: IMessageOpts) {
    super()
    this.id = shortId()
    this.text = text
    this.createdBy = createdBy
    this.username = username
    this.colorTheme = colorTheme
    this.timestamp = Date.now().toString()
  }
}
