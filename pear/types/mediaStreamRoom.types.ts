import { Schema, MapSchema } from '@colyseus/schema'

export interface IMediaUserOptions {
  publicAddress: string
  nickName?: string
  callId?: string
}

export interface IScreenShareOptions {
  peerId: string
  publicAddress?: string
  isScreenSharing: boolean
}

export interface IMediaStreamState extends Schema {
  connectedUsers: MapSchema<unknown>
  screenShares: MapSchema<unknown>
}
