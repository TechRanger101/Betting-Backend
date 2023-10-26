import fs from 'fs/promises'

import { ISlackBot } from './types'

export const createSlackCommands = (slackBot: ISlackBot) => {
  slackBot.server.message('request logs', async ({ message, say }: any) => {
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `
> Requesting all logs from <@${message.user}>!
> Click the button when you are ready to download
`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Download All logs',
            },
            action_id: 'download_global_logs',
          },
        },
      ],
      text: `Requesting logs from <@${message.user}>! Click the button when you are ready to download`,
    })

    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `
> Requesting error logs from <@${message.user}>!
> Click the button when you are ready to download
`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Download Error logs',
            },
            action_id: 'download_global_error_logs',
          },
        },
      ],
      text: `Requesting logs from <@${message.user}>! Click the button when you are ready to download`,
    })
  })

  slackBot.server.action('download_global_logs', async ({ ack, say, client }) => {
    const fileReadBuffer = await fs.readFile(`${process.cwd()}/logs/global.log`)

    await client.files.upload({
      channels: slackBot.demoTestnetChannelId,
      title: 'Global Logs',
      initial_comment: 'Output:',
      content: 'global-logs.json',
      filename: 'global-logs.json',
      filetype: 'json',
      file: fileReadBuffer,
    })

    await say('Downloaded global logs successfully!')
    await ack()
  })

  slackBot.server.action('download_global_error_logs', async ({ ack, say, client }) => {
    const fileReadBuffer = await fs.readFile(`${process.cwd()}/logs/global-error.log`)

    await client.files.upload({
      channels: slackBot.demoTestnetChannelId,
      title: 'Global Error Logs',
      initial_comment: 'Output:',
      content: 'global-error-logs.json',
      filename: 'global-error-logs.json',
      filetype: 'json',
      file: fileReadBuffer,
    })

    await say('Downloaded global error logs successfully!')
    await ack()
  })
}
