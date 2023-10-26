import { RouteController, HTTPRoute, WSRoute, binaryEncoder, binaryDecoder, logger } from '../utils'

const HealthController = new RouteController()

// HTTP Routes
HealthController.http.health = HTTPRoute((res, req) => {
  logger.info(`HTTP --> GET HealthCheck requested: ${req.getUrl()}`)
  res
    .writeStatus('200 OK')
    .writeHeader('HealthCheck', 'Active')
    .end('[FarePlayServer]: HealthCheck successful')
})

// WS Routes
HealthController.ws.health = WSRoute((ws, message, isBinary) => {
  // Decode message and echo message back to sender
  const decodedMsg = binaryDecoder.decode(message)
  logger.info(`WebSocket --> Received HealthCheck message: ${decodedMsg}`)
  const responseMsg = binaryEncoder.encode(`HealthCheck successful! Echo: "${decodedMsg}"`)
  ws.send(responseMsg, isBinary, true)
})

export default HealthController
