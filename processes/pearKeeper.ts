import redisStore from '../store'
import cryptoAdmin from '../crypto/admin'
import { logger } from '../crypto/utils'

function stopAllProcesses() {
  logger.info('Stopping all processes...')
  redisStore.disconnectAll()
}

async function main() {
  try {
    // Initialize Redis store for cryptoAdmin to use
    await redisStore.initialize()
    logger.info('Redis client connected successfully')
    logger.info('Redis store, repos, and services has been initialized')

    await cryptoAdmin.init()
    logger.info('cryptoAdmin initialized successfully')

    await cryptoAdmin.initPearKeeper()
    logger.info('PearKeeper process for Spin is active')

    process.once('SIGUSR2', stopAllProcesses)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

main()
