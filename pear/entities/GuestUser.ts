import { Schema, type } from '@colyseus/schema'
// import { Schema, Context } from '@colyseus/schema'

// const type = Context.create()

// GuestPlayers have access to join a room and spectate but they must authenticate with a wallet to enter into contract rounds.
export interface IGuestUser {
  guestId: string // Unique identifier for players
  sessionId?: string
  // @NOTE: Add properties that will keep track if a guest creates a new player account
}

export class GuestUser extends Schema implements IGuestUser {
  @type('string') guestId: string
  @type('string') sessionId: string

  constructor({ guestId, sessionId }: IGuestUser) {
    super()
    this.guestId = guestId
    this.sessionId = sessionId
  }
}
