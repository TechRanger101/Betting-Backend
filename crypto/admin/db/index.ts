import { MongoClient } from 'mongodb'
import { logger } from '../utils'
import { MONGO_ROOM_STORE_URI, MONGO_DATABASE_NAME } from '../constants'

export const createMongoInstance = async () => {
  try {
    logger.info('Connecting to mongodb room store...')
    const client = await MongoClient.connect(MONGO_ROOM_STORE_URI)
    logger.info('Connected to mongo room store!')

    return client
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export const mongoRoomStore = await createMongoInstance()

type PearRoomName = 'Spin' | 'Spin 2'
export const getRoomUserCount = async (roomName: PearRoomName) => {
  try {
    const spinRoomCache = await mongoRoomStore
      .db(MONGO_DATABASE_NAME)
      .collection('roomcaches')
      .findOne({ name: roomName })

    if (!spinRoomCache) throw new Error(`Could not find ${roomName} in mongo room cache.`)

    return spinRoomCache.clients as number
  } catch (err) {
    logger.error(err)
    throw err
  }
}
