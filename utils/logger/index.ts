import fs from 'fs'
import path from 'path'
import { createLogger, format, transports } from 'winston'
import chalk from 'chalk'

import { LogType, LoggerOptions, logColors } from './types'
import slackBotServer from '../../notifications/slack'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
}

export class Logger {
  static #logDirExists(logPath: string) {
    return fs.existsSync(logPath)
  }

  static #logFileExists(filePath: string) {
    return fs.existsSync(filePath)
  }

  static create(opts: LoggerOptions) {
    const { logType, theme = ['postiveGreen', 'regalYellow', 'royalRed'], ...args } = opts
    const [infoColor = 'postiveGreen', warnColor = 'regalYellow', errorColor = 'royalRed'] = theme

    const config = {
      levels,
      colors: {
        info: logColors[infoColor],
        warn: logColors[warnColor],
        error: logColors[errorColor],
      },
    }

    // winston.addColors(config.colors)

    const { logFilePath, errorFilePath } = this.#ensureLogFile(logType)

    // const logStreamTransport = new transports.Stream({
    // 	stream: fs.createWriteStream(logFilePath),
    // })

    const combinedFileTransport = new transports.File({ filename: logFilePath, level: 'info' })
    const errorFileTransport = new transports.File({ filename: errorFilePath, level: 'error' })

    const consoleTransport = new transports.Console({
      format: format.combine(
        format.errors({ stack: true }),
        format.printf(info => {
          if (info.level === 'error') {
            // Register slackBotServer
            if (slackBotServer.isConnected && process.env.NODE_ENV === 'production') {
              ;(async () => {
                try {
                  slackBotServer.createUploadFile('logger-error', JSON.stringify(info))
                } catch (err) {
                  slackBotServer.createUploadFile('logger-error', info.message)
                }
              })()
            }

            if (info.metadata) {
              return chalk
                .hex(config.colors.error)
                .bold(`[${logType}/${info.level}]: ${info.metadata.stack}`)
            }
            return chalk
              .hex(config.colors.error)
              .bold(`[${logType}/${info.level}]: ${info.message}`)
          }
          if (info.level === 'warn') {
            return chalk.hex(config.colors.warn)(`[${logType}/${info.level}]: ${info.message}`)
          }
          return chalk.hex(config.colors.info)(`[${logType}/${info.level}]: ${info.message}`)
        })
      ),
    })

    const winstonOptions = {
      format: format.combine(
        format.timestamp({ format: 'MM/DD HH:mma' }),
        format.errors({ stack: true }),
        format.json(),
        format.splat(),
        format.metadata()
      ),
      ...args,
      transports: [combinedFileTransport, errorFileTransport],
      levels: config.levels,
    }

    const logger = createLogger(winstonOptions)

    logger.add(consoleTransport)

    return logger
  }

  static #ensureLogFile(logType: LogType) {
    const logPath = `${process.cwd()}/logs`
    const filePath = `${logType.toLowerCase()}.log`
    const errorFilePath = `${logPath}/${logType.toLowerCase()}-error.log`

    const logFilePath = path.join(logPath, filePath)

    if (!this.#logDirExists(logPath)) fs.mkdirSync(logPath)

    if (!this.#logFileExists(logFilePath)) fs.writeFileSync(logFilePath, '')
    if (!this.#logFileExists(errorFilePath)) fs.writeFileSync(errorFilePath, '')

    return { logFilePath, errorFilePath }
  }
}

export default Logger.create({
  logType: 'Global',
  theme: ['paleGold'],
})

export * from './types'
