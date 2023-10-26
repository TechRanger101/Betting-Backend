import { Room } from '@colyseus/core'
import { Schema, MapSchema } from '@colyseus/schema'

import type ChatState from '../state/ChatState'

export class ChatRoom extends Room<ChatState> {}

export type OnMessageOptions = {
  publicAddress: string
  text: string
}

export interface IPlayerOptions {
  publicAddress: string
  username: string
}

export interface IChatMessageOptions {
  id: string
  text: string
  createdBy: string
  createdAt?: number
  isInStore: boolean
}

export interface IChatRoomState extends Schema {
  players: MapSchema<IPlayerOptions>
  messages: MapSchema<IChatMessageOptions>
}

export interface IDefaultRoomOptions {
  authToken?: string
  networkUsername?: string
  networkActorNumber?: string
}

export interface IMetaverseOptions {
  authToken?: string
  username?: string
  actorNumber?: string
}

export interface ICreateSpinRoomOptions {
  name?: string
  desc?: string
  password?: string
}
