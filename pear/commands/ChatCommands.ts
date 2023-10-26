import { Command } from '@colyseus/command'
import { Message, ChatUser, IChatUser, IGuestUser, GuestUser, IUser } from '../entities'
import { ChatRoom, OnMessageOptions } from '../types'
import { logger } from '../utils'
import store from '../../store'
import { ChatMessage } from '../constants'

// @NOTE: Define types for options
// @NOTE: Need to decide how to handle multiple sessionIds from multiple rooms joined
// @NOTE: Implement chat rate limiting

export class OnNewMessage extends Command<ChatRoom, OnMessageOptions> {
  async execute(options: OnMessageOptions) {
    try {
      const { publicAddress, text } = options

      if (!publicAddress || !this.state.users.get(publicAddress)) {
        logger.warn('Unauthorized user just tried to submit a chat message.')
        return
      }

      logger.info(`New message created by: ${publicAddress}`)

      const newMsg = new Message({
        text,
        createdBy: publicAddress,
      })

      this.room.broadcast(ChatMessage.NewChatMessage, newMsg) // @NOTE: Add except for client option here
    } catch (err) {
      logger.error(err)
      throw err
    }
  }
}

export class OnGuestChatUserJoined extends Command<ChatRoom, IGuestUser> {
  async execute({ guestId, sessionId }: IGuestUser) {
    const guestUser = new GuestUser({
      guestId,
      sessionId,
    })

    this.state.guestUsers.set(sessionId, guestUser)
  }
}

export class OnChatUserJoined extends Command<ChatRoom, IUser> {
  async execute({ publicAddress, sessionId }: { publicAddress: string; sessionId: string }) {
    try {
      const userEntity = await store.service.user.getUserByAddress(publicAddress)

      await store.service.user.updateUserSessionId(publicAddress, sessionId)

      const userOptions: IChatUser = {
        publicAddress,
        sessionId,
        username: userEntity.username,
        colorTheme: userEntity.colorTheme,
      }

      const user = new ChatUser(userOptions)

      this.state.users.set(publicAddress, user)
    } catch (err) {
      // @NOTE: NEED TO ADD ERROR QUEUE WHEN THIS IS HIT
      logger.error(err)
      throw err
    }
  }
}

export class OnUserLeave extends Command<
  ChatRoom,
  {
    sessionId: string
  }
> {
  async execute({ sessionId }: { sessionId: string }) {
    try {
      // Remove player from state
      if (this.state.users.has(sessionId)) {
        this.state.users.delete(sessionId)
        logger.info(`User has left SpinRoom: ${sessionId}`)
      } else if (this.state.guestUsers.has(sessionId)) {
        this.state.guestUsers.delete(sessionId)
        logger.info(`GuestUser has left SpinRoom: ${sessionId}`)
      } else {
        logger.warn("User left room but their sessionId wasn't in state. Look into why that is.")
      }
    } catch (err) {
      // @NOTE: NEED TO ADD ERROR QUEUE WHEN THIS IS HIT
      logger.error(err)
      throw err
    }
  }
}
