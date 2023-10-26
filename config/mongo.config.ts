export const {
  MONGO_ROOT_USERNAME,
  MONGO_ROOT_PASSWORD,
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DATABASE_NAME,
  MONGO_CONNECTION_STRING,
} = process.env

const getMongoUri = () => {
  // Connecting to stage/pre/prod requires a different format for the connection string.
  // It should be specified in the MONGO_CONNECTION_STRING environment variable.
  if (MONGO_CONNECTION_STRING) {
    return MONGO_CONNECTION_STRING
  }

  if (!MONGO_HOST) {
    return ''
  }

  return `mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE_NAME}`
}

export const mongoUri = getMongoUri()
