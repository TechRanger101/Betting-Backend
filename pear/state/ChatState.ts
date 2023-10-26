import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema'

import { GuestUser, ChatUser, Message } from '../entities'

export default class ChatRoomState extends Schema {
  @type({ map: ChatUser }) users = new MapSchema<ChatUser>()
  @type({ map: GuestUser }) guestUsers = new MapSchema<GuestUser>()
  @type([Message]) messages = new ArraySchema<Message>()
}
