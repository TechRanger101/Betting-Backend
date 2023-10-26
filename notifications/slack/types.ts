import SlackBolt from '@slack/bolt'

export type SlackBoltApp = InstanceType<typeof SlackBolt.App>

export enum SlackChannels {
  MetaverseEnvLogs = 'metaverse-environment-logs',
  DemoTestnet = 'demo-testnet',
}

export interface ISlackBot {
  server: SlackBoltApp
  channelIdMap: Map<string, string>
  token: string
  metaverseLogChannelId: string
  demoTestnetChannelId: string
  getIdByName: (name: string | SlackChannels) => string
  createUploadFile: (name: string, buf: string | Buffer) => void
}
