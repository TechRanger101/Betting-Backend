import { Dispatcher } from '@colyseus/command'
import { Room, ServerError, Client } from '@colyseus/core'
import type { IMetaverseOptions, IRoomOptions } from '../types'
import { logger } from '../utils'

// Libraries
import { HttpStatusCode } from '../constants'
import MetaverseState from '../state/MetaverseState'

import { UserStream } from '../entities'

// @NOTE: Need to create store service that handles updating analytics

function createPeerId() {
  return Math.random().toString(36).substring(2, 10)
}

class Metaverse extends Room<MetaverseState> {
  maxClients = 64
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

      this.setState(new MetaverseState())
    } catch (err) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  async onAuth(client: Client, options: IMetaverseOptions = {}) {
    try {
      const { authToken, actorNumber, username } = options
      const peerId = createPeerId()
      client.userData = {
        authToken,
        username,
        actorNumber,
      }

      return peerId
    } catch (err: any) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  async onJoin(client: Client, _options: IMetaverseOptions = {}, auth?: string) {
    try {
      /* @ts-ignore */
      const { sessionId } = client

      logger.info('User just joined with sessionId:', sessionId)
      const userStream = new UserStream()
      userStream.peerId = auth
      userStream.actorNumber = client.userData.actorNumber
      userStream.username = client.userData.username

      this.state.streams.set(sessionId, userStream)
    } catch (err) {
      logger.error(err)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, err.toString())
    }
  }

  onLeave(client: Client) {
    const { sessionId } = client

    if (this.state.streams.has(sessionId)) {
      this.state.streams.delete(sessionId)
    }
  }

  onDispose() {
    // @NOTE: Need to clear garbage here

    this.dispatcher.stop()
    logger.info('Disposing of SpinContract room...')
  }
}

export default Metaverse
