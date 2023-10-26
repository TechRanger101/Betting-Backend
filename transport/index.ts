import { uWebSocketsTransport } from '@colyseus/uwebsockets-transport'
import type { TemplatedApp } from 'uWebSockets.js'
import type { Express } from 'express'
import type { Server } from 'http'

import type { ITransportOptions } from './types'
import { logger } from './utils'
import createRoutes from './routes'
import createMonitorDashboard from './monitor'
import fast from './fastify'
import {
  transportOptions as defaultTransportOptions,
  appOptions as defaultAppOptions,
  fareMonitorPort as defaultFareMonitorPort,
} from '../config/transport.config'

/** Create HTTP/WS server instance
 * Used as the transport layer for state syncing - This is imported by `server/pear/index.ts`
 * Additionally, handles general HTTP and WS requests defined in `server/transport/routes.ts`
 */
export class Transport {
  instance!: uWebSocketsTransport
  app!: TemplatedApp
  #fareMonitor: ReturnType<typeof createMonitorDashboard>
  fareMonitorPort = defaultFareMonitorPort
  fareMonitorServer?: Server
  logger = logger

  constructor({
    transportOpts = defaultTransportOptions,
    appOpts = defaultAppOptions,
    fareMonitorPort = defaultFareMonitorPort,
  }: ITransportOptions) {
    // Create new uWebSocketsTransport instance
    this.instance = new uWebSocketsTransport(transportOpts, appOpts)
    this.app = this.instance.app
    this.fareMonitorPort = fareMonitorPort

    // Create routes from transport instance
    createRoutes(this.app)
    logger.info(`Created (HTTP/WS) routes for transport`)
  }

  async startMonitorDashboard(newFareMonitorPort?: number): Promise<Express> {
    return new Promise((resolve, reject) => {
      this.fareMonitorPort = newFareMonitorPort || this.fareMonitorPort
      this.#fareMonitor = createMonitorDashboard()
      this.fareMonitorServer = this.#fareMonitor
        .listen(this.fareMonitorPort, () => {
          logger.info(`Pear monitor dashboard running on port ${this.fareMonitorPort}...`)
          resolve(this.#fareMonitor)
        })
        .on('error', reject)
    })
  }

  async stopMonitorDashboard() {
    return new Promise((resolve, reject) => {
      if (this.fareMonitorServer) {
        this.fareMonitorServer.close(err => {
          if (err) reject(err)
          const successMsg = `Pear monitor dashboard closed (port: ${this.fareMonitorPort})`
          logger.info(successMsg)
          resolve(successMsg)
        })
      }
    })
  }

  async stopAll() {
    if (this.instance) {
      await this.stopMonitorDashboard()
      this.instance.shutdown()
      this.logger.info('Transport server has been stopped.')
    }
  }
}

fast.listen({ port: Number(process.env.FAST_SERVER_PORT || 3200), host: "0.0.0.0" }, err => {
  if (err) {
    logger.error(err)
    return
  }
  logger.info(`Fast server started on port ${process.env.FAST_SERVER_PORT}`)
})

export default new Transport({
  transportOpts: {
    idleTimeout: 0,
  },
})
