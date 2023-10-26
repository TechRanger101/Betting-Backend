import { Server, LobbyRoom, matchMaker, RoomListingData } from '@colyseus/core'

import type { RoomMap } from '../types'
import SpinRoom from './SpinRoom'
import ChatRoom from './ChatRoom'
import Metaverse from './Metaverse'
import { onLocalEvent } from '../../utils'
import { logger } from '../utils'

import { RoomName } from '../constants'

export const roomList: RoomMap = {
  lobby: {
    name: RoomName.Lobby,
    def: LobbyRoom,
    options: {
      name: 'Match-making Lobby',
      desc: 'Lobby room for matching-making',
      password: null,
    },
  },
  spin: {
    name: RoomName.Spin,
    def: SpinRoom,
    options: {
      name: 'Spin',
      desc: 'Fareplay Spin Room',
      password: null,
    },
  },
  spin2: {
    name: RoomName.Spin2,
    def: SpinRoom,
    options: {
      name: 'Spin 2',
      desc: 'Fareplay Spin 2 Room',
      password: null,
    },
  },
  chat: {
    name: RoomName.ChatRoom,
    def: ChatRoom,
    options: {
      name: 'Chat Room',
      desc: 'General chat room for players.',
      password: null,
    },
  },
  metaverse: {
    name: RoomName.Metaverse,
    def: Metaverse,
    options: {
      name: 'Metaverse room',
      desc: 'Metaverse room',
      password: null,
    },
  },
}

class Rooms {
  pearServer: Server = null
  RoomName = RoomName
  roomList = roomList
  spinRoom?: RoomListingData
  spin2Room?: RoomListingData

  constructor(pearServer: Server) {
    this.pearServer = pearServer

    this.bindEventListeners()
  }

  bindEventListeners() {
    // onServerStarted
    onLocalEvent('server-started', async () => {
      const { spin } = this.roomList
      try {
        this.spinRoom = await matchMaker.createRoom(spin.name, spin.options)
      } catch (err) {
        logger.warn(err)
      }
    })
  }

  createAll() {
    const { spin } = this.roomList
    // const { chat, spin, spin2, lobby, metaverse } = this.roomList

    // Define and create spin room
    this.pearServer.define(spin.name, spin.def, spin.options)

    // this.pearServer.define(chat.name, chat.def, chat.options).enableRealtimeListing()
    // this.pearServer.define(spin2.name, spin2.def, spin2.options)
    // this.pearServer.define(lobby.name, lobby.def, lobby.options)
    // this.pearServer.define(metaverse.name, metaverse.def, metaverse.options)
  }
}

export default Rooms
