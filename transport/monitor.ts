import express from 'express'
import basicAuth from 'express-basic-auth'
import { monitor } from '@colyseus/monitor'

import { fareMonitorUsername, fareMonitorPassword } from '../config/transport.config'

/** Colyseus monitor dashboard
 * This should not be used in production.
 * This is for development and debugging locally
 */
export default function createMonitorDashboard() {
  const fareMonitor = express()

  const basicAuthMiddleware = basicAuth({
    users: {
      // Schema - [username]: password
      [fareMonitorUsername]: fareMonitorPassword,
    },
    realm: 'freshKeepOn',
    challenge: true,
  })

  // Middleware
  fareMonitor.use('/fare-state', basicAuthMiddleware, monitor())

  return fareMonitor
}
