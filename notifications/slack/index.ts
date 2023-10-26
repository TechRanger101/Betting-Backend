import SlackBolt from '@slack/bolt'
import { Logger } from 'winston'

import { createSlackCommands } from './commands'
import { SlackBoltApp, ISlackBot, SlackChannels } from './types'
import { isProd } from '../../config'
// import { createSlackEvents } from './events'

const {
  SLACK_OAUTH_TOKEN: token,
  SLACK_APP_TOKEN: appToken,
  SLACK_SIGNING_SECRET: signingSecret,
  SLACK_BOT_PORT: port = 4255,
} = process.env

const { App } = SlackBolt

class SlackBot implements ISlackBot {
  #server?: SlackBoltApp
  channelIdMap = new Map<string, string>()
  isConnected = false
  logger: Logger

  get server() {
    return this.#server
  }

  get token() {
    return token
  }

  get metaverseLogChannelId() {
    return this.channelIdMap.get(SlackChannels.MetaverseEnvLogs)
  }

  get demoTestnetChannelId() {
    return this.channelIdMap.get(SlackChannels.DemoTestnet)
  }

  constructor() {
    if (isProd) {
      this.#server = new App({
        token,
        appToken,
        socketMode: true,
        signingSecret,
        logLevel: SlackBolt.LogLevel.WARN,
      })
    }
  }

  setLogger(logger: Logger) {
    this.logger = logger
  }

  async initServer() {
    try {
      this.logger.info('Initializing Slack Server Bot...')
      if (!token || !appToken) {
        this.logger.info(
          'No SLACK_BOT_TOKEN or SLACK_BOT_SIGNING_SECRET present. Stopping initialization.'
        )
        return
      }

      // Initialize Slack Bot Server
      await this.server.start(Number(port))
      this.isConnected = true
      this.logger.info(`Slack Server Bot started on port ${port}...`)

      // Populate channelName: channelId Map
      await this.populateChannelIdMap()

      // Create interactions
      createSlackCommands(this)
      // createSlackEvents(this) // @NOTE: Commented out since there are no events defined

      return this.#server
    } catch (err) {
      this.logger.error(err)
      this.isConnected = false
    }
  }

  async populateChannelIdMap() {
    try {
      const result = await this.server.client.conversations.list({
        token,
      })

      for (const channel of result.channels) {
        this.channelIdMap.set(channel.name, channel.id)
      }
    } catch (err) {
      this.logger.error(err)
    }
  }

  getIdByName(name: string | SlackChannels) {
    return this.channelIdMap.get(name)
  }

  async sendChannelMessage(
    text: string,
    channelName: string | SlackChannels = SlackChannels.DemoTestnet
  ) {
    try {
      const channel = this.channelIdMap.get(channelName)
      if (!channel) {
        throw new Error('Channel name not found')
      }

      await this.server.client.chat.postMessage({
        token,
        channel,
        text,
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  async createUploadFile(fileName: string, buf: string | Buffer) {
    try {
      let fileBuffer = buf
      if (!(fileBuffer instanceof Buffer)) {
        fileBuffer = Buffer.from(buf as string, 'utf8')
      }
      await this.server.client.files.upload({
        channels: this.demoTestnetChannelId,
        title: 'Error Message',
        initial_comment: 'Error output:',
        content: `${fileName}.json`,
        filename: `${fileName}.json`,
        filetype: 'json',
        file: fileBuffer,
      })
    } catch (err) {
      this.logger.error(err)
    }
  }
}

const slackBotServer = new SlackBot()

export default slackBotServer
