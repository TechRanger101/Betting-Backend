import {
  Schema,
  MapSchema,
  type,
  // SetSchema,
  // ArraySchema,
  // Context,
} from '@colyseus/schema'

import {
  BatchEntry,
  GuestUser,
  User,
  Round,
  type IGuestUser,
  type IRound,
  type IBatchEntry,
  type IUser,
} from '../entities'

import { type SpinRoomStatus } from '../../store/types'

// const type = Context.create()

export interface ISpinState extends Schema {
  guestUsers: MapSchema<IGuestUser>
  users: MapSchema<IUser>
  batchEntries: MapSchema<IBatchEntry>
  round: MapSchema<IRound>
  roomStatus: SpinRoomStatus
  fareTotalSupply: string
  currentRoundId: number
  isRoundPaused: boolean
  countdownTotal: number
  spinTick: number
}

export class SpinState extends Schema {
  // sessionId(probably publicAddress?) -> Player, GuestPlayer
  @type({ map: GuestUser }) guestUsers = new MapSchema<GuestUser>()
  @type({ map: User }) users = new MapSchema<User>()

  // publicAddress -> BatchEntry
  @type({ map: BatchEntry }) batchEntries = new MapSchema<BatchEntry>()

  // roundId -> Round
  @type({ map: Round }) round = new MapSchema<Round>()

  // @NOTE: Ensure that publicAddress can only submit one batchEntry per round (in smart contract)
  // @NOTE: Determine if we should start wheel at 2-5 mins or once 300 players are reached
  @type('string') roomStatus = 'countdown'

  @type('string') fareTotalSupply: string
  @type('number') currentRoundId: number
  @type('boolean') isRoundPaused = false
  @type('number') countdownTotal: number
  @type('number') spinTick = 0
}
