const { SALT_ROUNDS, JWT_EXPIRATION, FARE_SERVER_PORT, NODE_APP_INSTANCE } = process.env

// Used for running multiple processes on a single server instances
export const pearServerPort = Number(FARE_SERVER_PORT || 3100) + Number(NODE_APP_INSTANCE || 0)

// @NOTE: Perhaps need to move to redis.config since it's for generating JWT
export const saltRounds = Number(SALT_ROUNDS || 10)
export const jwtExpiration = JWT_EXPIRATION || '30d'
