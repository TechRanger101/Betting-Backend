import { v4 as uuid } from 'uuid'

import { binaryEncoder, binaryDecoder, logger, WSRoute, RouteController } from '../utils'

const PingController = new RouteController()

const clientMap = new Map()

PingController.ws.latency = WSRoute((ws, message, isBinary) => {
  const pingData = binaryDecoder.decode(message)
  const pingJson = JSON.parse(pingData)
  let clientId = ''
  let resp: any = {}

  if (!clientMap.has(pingJson.clientId)) {
    clientId = uuid()
    clientMap.set(clientId, {
      clientId,
      timestamp: pingJson.timestamp,
      pingMs: 0,
    })
    resp.clientId = clientId
    resp.timestamp = new Date().valueOf()
  } else {
    resp.clientId = pingJson.clientId
    resp.timestamp = new Date().valueOf()
  }

  // Decode message and echo message back to sender
  // logger.info('WebSocket', 'Ping Received', JSON.stringify(clientMap.get(pingJson.clientId)))
  const responseMsg = binaryEncoder.encode(JSON.stringify(resp))

  if (!pingJson.isPingingBack) {
    ws.send(responseMsg, isBinary, true)
  } else {
    const ping = new Date().valueOf() - pingJson.latestTimestamp
    clientMap.set(pingJson.clientId, {
      clientId,
      clientTimestamp: pingJson.newTimestamp,
      serverTimestamp: pingJson.latestTimestamp,
      currentTimeStamp: new Date().valueOf(),
      pingMs: ping,
    })
    logger.info(`${pingJson.clientId}: ping ${ping}ms`)
  }
})

export default PingController
