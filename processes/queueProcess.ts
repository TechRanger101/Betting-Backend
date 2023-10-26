import redisStore from '../store'
import logger from '../utils/logger'

// Handle stopping processes on exit, error, or shutdown
function stopAllProcesses() {
  logger.info('Stopping all processes...')
  redisStore.disconnectAll()
}

async function init() {
  try {
    await redisStore.initialize()
    await redisStore.initQueue()

    process.once('SIGUSR2', stopAllProcesses)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

init()
