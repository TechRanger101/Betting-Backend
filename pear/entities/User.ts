import { Schema, type } from '@colyseus/schema'
// import { Schema, Context, type } from '@colyseus/schema'
import { Balance, IBalance } from './Balance'

// const type = Context.create()

export interface IUser {
  // entityId: string // Redis hashId to reference in Redis store (emitted from pubsub event)
  publicAddress: string // Unique identifier for players
  username?: string // Optional username set by player
  colorTheme?: string // @NOTE: Create colorTheme enum - Optional color theme set by players
  sessionId?: string
  balance?: IBalance
  fareBalance?: string
  ethBalance?: string
  isInRound?: boolean
}

export class User extends Schema implements IUser {
  @type('string') publicAddress: string
  @type('string') username?: string
  @type('string') colorTheme?: string
  @type('string') ethBalance?: string
  @type('string') fareBalance?: string
  @type('boolean') isInRound?: boolean
  @type(Balance) balance = new Balance()

  constructor({
    publicAddress,
    username,
    colorTheme,
    balance: { fare, eth },
    isInRound = false,
  }: IUser) {
    super()
    this.publicAddress = publicAddress
    this.username = username
    this.colorTheme = colorTheme
    this.ethBalance = eth
    this.fareBalance = fare
    this.balance.fare = fare
    this.balance.eth = eth
    this.isInRound = isInRound
  }
}
