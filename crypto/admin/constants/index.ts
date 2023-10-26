import { utils } from 'ethers'

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

  if (!MONGO_HOST || !MONGO_PORT) {
    return ''
  }

  return `mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}?authSource=admin`
}
export const MONGO_ROOM_STORE_URI = getMongoUri()

export const ENTRIES_OPEN_COUNTDOWN_DURATION = 30_000
export const PRE_SPIN_DURATION = 5_000
export const WHEEL_SPINNING_DURATION = 10_000
export const RESULT_SCREEN_DURATION = 3_000
export const SEC_MS = 1000
export const SEED_USER_SUBMIT_FEQUENCY = 3_000 // Amount of secs between seed user batchEntry submits
export const SEED_AVAX_FAUCET_AMOUNT = utils.parseEther('35')
export const SEED_FARE_FAUCET_AMOUNT = utils.parseEther('10000000')
export const DEFAULT_PATCH_RATE = 1000 / 20 // 20fps (50ms)
export const DEFAULT_SIMULATION_INTERVAL = 1000 / 60 // 60fps (16.66ms)

export const getCountdownScalingFactor = (userCount: number) => {
  if (userCount === 1) return 3_000
  if (userCount <= 2) return 10_000

  const scalingFactor = Math.min(userCount, 10)

  return (10 + scalingFactor * 2) * 1000
}
