import { Schema, type } from '@colyseus/schema'
// import { Schema, Context, type } from '@colyseus/schema'

// const type = Context.create()

export interface IBalance {
  eth: string // @NOTE: may need to rename this to avaxBalance when we deploy to production
  fare: string // Amount of fareToken
  // @NOTE: May need to add summary balances. i.e fareInQueue, fareMinted, fareBurned, etc.
  // @NOTE: When we implement multi currency, we need to pull in other crypto currency balances (USDT, USDC, LINK, BTC, XRP, ...)
}

export class Balance extends Schema implements IBalance {
  @type('string') eth: string
  @type('string') fare: string
}
