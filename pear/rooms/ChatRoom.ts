import { Dispatcher } from '@colyseus/command'
import { Room, ServerError, Client } from '@colyseus/core'
import shortId from 'shortid'

// Libraries
import type { IDefaultRoomOptions, IRoomOptions } from '../types'
import store from '../../store'
import { HttpStatusCode, ChatMessage, SpinEvent } from '../constants'
import ChatState from '../state/ChatState'
import { logger } from '../utils'
import {
  OnChatUserJoined,
  OnUserLeave,
  OnNewMessage,
  OnGuestChatUserJoined,
} from '../commands/ChatCommands'

// @NOTE: Need to create store service that handles updating analytics

class ChatRoom extends Room<ChatState> {
  maxClients = 100
  private name: string
  private desc: string
  private password: string | null = null
  private dispatcher = new Dispatcher(this)

  async onCreate(options: IRoomOptions) {
    try {
      const { name, desc, password } = options
      this.name = name
      this.desc = desc
      this.password = password

      let hasPassword = false
      if (password) {
        // @NOTE: Handle hashing password before setting the metadata
        logger.info(`Password was set ${password}`)
        hasPassword = true
      }
      this.setMetadata({
        name,
        desc,
        hasPassword,
      })

      this.setState(new ChatState())

      this.onMessage(ChatMessage.NewChatMessage, (client: Client, text: string) => {
        this.dispatcher.dispatch(new OnNewMessage(), {
          publicAddress: client.auth,
          text,
        })
      })
    } catch (err) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  async onAuth(client: Client, options: IDefaultRoomOptions = {}) {
    try {
      const { authToken } = options

      // Handle authenticated user
      if (authToken) {
        const user = await store.service.user.getUserFromToken(authToken)

        if (!user) {
          logger.error(new Error('Invalid user authToken.'))
          throw new ServerError(HttpStatusCode.UNAUTHORIZED, 'Invalid user authToken.')
        }

        return user.publicAddress
      }

      // Handle guest user
      const guestId = shortId() // Generate guestId
      logger.info(`User logging in as guest with username: ${guestId}`)
      client.send(SpinEvent.GuestUserJoined, guestId)

      return `guest:${guestId}`
    } catch (err: any) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  async onJoin(client: Client, _options: IDefaultRoomOptions = {}, auth?: string) {
    try {
      /* @ts-ignore */
      const { sessionId } = client
      const [publicAddress, guestId] = auth.split(':')
      logger.info(`public address --> ${publicAddress},\n guest id --> ${guestId}`)

      if (guestId) {
        this.dispatcher.dispatch(new OnGuestChatUserJoined(), { sessionId, guestId })
      } else if (publicAddress) {
        logger.info(
          `Updated users sessionId: public address --> ${publicAddress},\n session id --> ${sessionId}`
        )
        this.dispatcher.dispatch(new OnChatUserJoined(), {
          publicAddress,
          sessionId,
        })
      } else {
        throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Auth token does not exist.')
      }
    } catch (err) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  onLeave(client: Client) {
    const { sessionId } = client

    this.dispatcher.dispatch(new OnUserLeave(), {
      sessionId,
    })
  }

  onDispose() {
    // @NOTE: Need to clear garbage here

    this.dispatcher.stop()
    logger.info('Disposing of SpinContract room...')
  }
}

export default ChatRoom
