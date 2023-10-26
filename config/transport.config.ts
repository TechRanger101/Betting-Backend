import { DEDICATED_COMPRESSOR_3KB } from 'uWebSockets.js'
import type { AppOptions } from 'uWebSockets.js'
import type { TransportOptions } from '@colyseus/uwebsockets-transport'

export const webSocketOptions = {
  /* There are many common helper features */
  idleTimeout: 32,
  maxBackpressure: 1024,
  maxPayloadLength: 512,
  compression: DEDICATED_COMPRESSOR_3KB,
}

// @NOTE: Configure later (options at the bottom)
export const appOptions: AppOptions = {}

// @NOTE: Configure later (options at the bottom)
export const transportOptions: TransportOptions = {}

// @NOTE: Used to access pear monitor dashboard
export const fareMonitorPort = process.env.FARE_STATE_MONITOR_PORT || 4200
export const fareMonitorUsername = process.env.FARE_STATE_MONITOR_USERNAME || 'admin'
export const fareMonitorPassword = process.env.FARE_STATE_MONITOR_PASSWORD || 'pearPlay123'

// @NOTE: Used for authenticating photon fusion in the Unity editor
export const authOverrideToken = process.env.AUTH_OVERRIDE_TOKEN
