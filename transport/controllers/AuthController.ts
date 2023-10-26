import { RouteController, HTTPRoute, logger } from '../utils'
import store from '../../store'

const AuthController = new RouteController()

// HTTP Routes
AuthController.http.health = HTTPRoute((res, req) => {
  logger.info(`HTTP --> GET AuthController:HealthCheck requested: ${req.getUrl()}`)
  res
    .writeStatus('200 OK')
    .writeHeader('HealthCheck', 'Active')
    .end('[FarePlayServer]: HealthCheck successful')
})

AuthController.http.generateNonce = HTTPRoute(async (res, req) => {
  res.onAborted(() => {
    res.aborted = true
  })
  try {
    const publicAddress = req.getHeader('public-address')
    logger.info(`HTTP --> GET AuthController:generateNonce requested: ${req.getUrl()}`)

    const { nonce, signingMessage } = await store.service.user.authPublicAddress(publicAddress)
    const jsonResponse = JSON.stringify({
      nonce,
      signingMessage,
    })
    if (!res.aborted) {
      res
        .writeStatus('500 Internal Server Error')
        .writeHeader('Content-Type', 'application/json')
        .end(jsonResponse)
    }
  } catch (error) {
    res.writeStatus('500').end(error.toString())
    res.aborted = true
  }
})

export default AuthController
