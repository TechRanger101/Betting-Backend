import { Schema, type } from '@colyseus/schema'
// import { Schema, Context } from '@colyseus/schema'

// const type = Context.create()

export interface IChatUser {
  // entityId: string // Redis hashId to reference in Redis store (emitted from pubsub event)
  publicAddress: string // Unique identifier for players
  username?: string // Optional username set by player
  colorTheme?: string // @NOTE: Create colorTheme enum - Optional color theme set by players
  sessionId?: string
}

export class ChatUser extends Schema implements IChatUser {
  @type('string') publicAddress: string
  @type('string') username?: string
  @type('string') colorTheme?: string

  constructor({ publicAddress, username, colorTheme }: IChatUser) {
    super()
    this.publicAddress = publicAddress
    this.username = username
    this.colorTheme = colorTheme
  }
}
