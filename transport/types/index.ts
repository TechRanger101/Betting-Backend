import { TransportOptions } from '@colyseus/uwebsockets-transport'
import type {
  WebSocket,
  HttpResponse,
  HttpRequest,
  WebSocketBehavior as _WebsocketBehavior,
  AppOptions,
} from 'uWebSockets.js'

// export type { WebSocketBehavior } from 'uWebSockets.js'

export type RouteHandler = (res: HttpResponse, req: HttpRequest) => void

export interface IRouteController {
  http?: {
    [routeName: string]: RouteHandler
  }
  ws?: {
    [routeName: string]: any
  }
}

export interface ITransportOptions {
  transportOpts?: TransportOptions
  appOpts?: AppOptions
  fareMonitorPort?: number | string
}

export type WSHandler = (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => void
