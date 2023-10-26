import type { TemplatedApp } from 'uWebSockets.js'

import { AuthController, HealthController, PingController } from './controllers'

// @NOTE: We may need to set up cors if this setup causes problems with the frontend
// @REFERENCE: https://github.com/uNetworking/uWebSockets.js/discussions/316#discussioncomment-2027652
const createRoutes = (app: TemplatedApp) => {
  // Auth HTTP routes
  app.get('/auth/health', AuthController.http.health)
  app.get('/auth/generate-nonce', AuthController.http.generateNonce)

  // Health HTTP/WS routes
  app.get('/health', HealthController.http.health)
  app.ws('/health', HealthController.ws.health)

  // Ping WS routes
  app.ws('/latency', PingController.ws.latency)
}

export default createRoutes
