// General
const { NODE_ENV } = process.env

export const isDev = NODE_ENV === 'development'
export const isProd = NODE_ENV === 'production'

// Import/Exports
export * from './mongo.config'
export * from './pear.config'
export * from './redis.config'
export * from './rpc.config'
