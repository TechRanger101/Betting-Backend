import { Schema, MapSchema, type } from '@colyseus/schema'

export interface IMediaStream {
  publicAddress: string
  screenShareEnabled: boolean
  videoEnabled: boolean
  audioEnabled: boolean
}

export class MediaStream extends Schema implements IMediaStream {
  @type('string') publicAddress: string
  @type('boolean') screenShareEnabled: boolean
  @type('boolean') videoEnabled: boolean
  @type('boolean') audioEnabled: boolean
}

export class MediaStreamState extends Schema {
  @type({ map: MediaStream }) streams = new MapSchema<MediaStream>()
}
