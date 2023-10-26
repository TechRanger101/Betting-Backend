import { TextEncoder, TextDecoder } from 'util'
import type { WebSocketBehavior as _WebSocketBehavior, HttpResponse } from 'uWebSockets.js'
import type { IRouteController, RouteHandler, WSHandler } from '../types'

import { Logger } from '../../utils'
import { webSocketOptions } from '../../config/transport.config'

export const logger = Logger.create({ logType: 'Transport', theme: ['purple'] })

export const binaryDecoder = new TextDecoder('utf-8')
export const binaryEncoder = new TextEncoder()

export function WSRoute(wsHandler: WSHandler) {
  // Apply middleware here (cors for example)
  return {
    /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    ...webSocketOptions,
    message: wsHandler,
  }
}

export function HTTPRoute(httpHandler: RouteHandler) {
  // Apply middleware here (cors for example)
  return httpHandler
}

export class RouteController implements IRouteController {
  ws?: { [routeName: string]: ReturnType<typeof WSRoute> } = {}
  http?: { [routeName: string]: RouteHandler } = {}
}

/* Helper function for reading a posted JSON body */
export const parseReq = (res: HttpResponse, cb: any, err: any) => {
  let buffer: Buffer
  /* Register data cb */
  res.onData((ab, isLast: boolean) => {
    let chunk = Buffer.from(ab)
    if (isLast) {
      let json: string
      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]).toString())
        } catch (e) {
          /* res.close calls onAborted */
          res.close()
          return
        }
        cb(json)
      } else {
        try {
          json = JSON.parse(chunk.toString())
        } catch (e) {
          /* res.close calls onAborted */
          res.close()
          return
        }
        cb(json)
      }
    } else if (buffer) {
      buffer = Buffer.concat([buffer, chunk])
    } else {
      buffer = Buffer.concat([chunk])
    }
  })

  /* Register error cb */
  res.onAborted(err)
}
