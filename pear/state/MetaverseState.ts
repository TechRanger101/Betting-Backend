import { Schema, MapSchema, type } from '@colyseus/schema'

import { UserStream } from '../entities'

export default class MediaStreamState extends Schema {
  @type({ map: UserStream }) streams = new MapSchema<UserStream>()
}
