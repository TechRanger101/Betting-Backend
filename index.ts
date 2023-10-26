import pearServer from './pear'
import redisStore from './store'
import transport from './transport'
import slackBotServer from './notifications/slack'
import logger from './utils/logger'
import { emitLocalEvent } from './utils'
import { pearServerPort, isDev, isProd } from './config'
import { fireTheAlarms } from './notifications/pagerDuty'

// Handle stopping processes on exit, error, or shutdown
function stopAllProcesses() {
  logger.info('Stopping all processes...')
  redisStore.disconnectAll()
  pearServer.stopAll()
  transport.stopAll()
}

// Mount uncaught error eventListeners
process.on('uncaughtException', async err => {
  try {
    await fireTheAlarms('FP-backend uncaughtException', err.toString())
  } catch (error) {
    logger.error(error)
  } finally {
    logger.error(err)
  }
})

process.on('unhandledRejection', async err => {
  try {
    await fireTheAlarms('FP-backend uncaughtRejection', err.toString())
  } catch (error) {
    logger.error(error)
  } finally {
    logger.error(err)
  }
})

async function init() {
  try {
    // Initialize slack bot and dependency inject logger
    if (isProd) {
      try {
        slackBotServer.setLogger(logger)
        await slackBotServer.initServer()
      } catch (err) {
        logger.error(err)
      }
    }

    // If running multiple processes, ensures only one RPC server and RedisStore instance is created
    if (pearServerPort === 3100) {
      // @NOTE: Setup clustering for Redis
      await redisStore.initialize()
      await redisStore.initQueue()
      await redisStore.initSmartContractListeners()
    }

    // Initializes HTTP/WebSocket server (default port: 3100)
    // Configured to run multiple processes and round robin requests
    await pearServer.listen()

    // Pear monitor dashboard (default port: 4200)
    if (isDev || process.env.FARE_STATE_MONITOR_PASSWORD) {
      await transport.startMonitorDashboard()
    }

    // @NOTE: Need to add more exit eventListeners conditions
    process.once('SIGUSR2', stopAllProcesses)

    emitLocalEvent('server-started', '')
  } catch (err) {
    try {
      await fireTheAlarms('FP-backend has crashed', err.toString())
    } finally {
      logger.error(err)
      process.exit(1)
    }
  }
}

init()
