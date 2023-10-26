import { Schema, type } from '@colyseus/schema'
// import { Schema } from '@colyseus/schema'

// const type = Context.create()

export interface IUserStream {
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenShareEnabled: boolean
  isVideoActive: boolean
  isAudioActive: boolean
  isScreenShareActive: boolean
  actorNumber: string
  username: string
  peerId: string
}

export class UserStream extends Schema implements IUserStream {
  @type('boolean') isVideoEnabled: boolean
  @type('boolean') isAudioEnabled: boolean
  @type('boolean') isScreenShareEnabled: boolean
  @type('boolean') isVideoActive: boolean
  @type('boolean') isAudioActive: boolean
  @type('boolean') isScreenShareActive: boolean
  @type('string') actorNumber: string
  @type('string') username: string
  @type('string') peerId: string
}
