import { RoomName } from '../constants'

export interface IRoomOptions {
  name: string
  desc?: string
  password?: string | null
}

export type RoomDef = {
  name: RoomName
  def: any
  options?: IRoomOptions
}

export type RoomMap = {
  lobby: RoomDef
  chat: RoomDef
  spin: RoomDef
  spin2: RoomDef
  metaverse: RoomDef
}
