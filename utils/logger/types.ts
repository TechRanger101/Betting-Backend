import { LoggerOptions as WinstonLoggerOptions } from 'winston'

export type LogType =
  | 'Crypto'
  | 'Global'
  | 'Pear'
  | 'Pub'
  | 'Queue'
  | 'RPC'
  | 'RedisStore'
  | 'Sub'
  | 'Transport'
  | 'Worker'
  | 'Crypto'
  | 'CryptoAdmin'

export const logColors = {
  blue: '#0277BD',
  pink: '#F8873A',
  brightPink: '#CE49BF',
  palePink: '#FF7396',
  purple: '#764AF1',
  lightGreen: '#B4FF9F',
  neonGreen: '#17D7A0',
  royalRed: '#ef5350',
  regalYellow: '#F7D716',
  postiveGreen: '#14C38E',
  mexicanBrown: '#C69B7B',
  gold: '#FFC600',
  paleGold: '#FFF89C',
}

export type LogTheme = keyof typeof logColors

export type LoggerOptions = {
  logType: LogType
  theme?: [LogTheme, LogTheme?, LogTheme?]
} & WinstonLoggerOptions
