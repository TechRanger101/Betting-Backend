import { Schema, type } from '@colyseus/schema'
// import { Schema, Context, type } from '@colyseus/schema'

// const type = Context.create()

// @NOTE: Add wheel event messages to control global wheel events
// export enum RoundState {
//     Countdown = 'Countdown',
//     Spinning = 'Spinning',
//     Stopping = 'Stopping',
//     Finished = 'Finished',
// }

export interface IRound {
  // entityId: string // Redis hashId to reference in Redis store (emitted from pubsub event)
  roundId: number
  randomNum: number
  // @NOTE: Need to parse out minting numbers for 2x, 10x, 100x
  // twoXNum: (0 - 1)
  // tenXNum: (0 - 9)
  // hundoNum: (0 - 99)
  randomEliminator: string
  revealKey: string
  randomHash: string
  startedTxHash: string
  endedTxHash: string
  startedAt: number
  endedAt: number
  fullRandomNum: string
  isTwoXElim: boolean
  isTenXElim: boolean
  isHundoXElim: boolean
  // @NOTE: Add analytics below
  // fareTotalStartingSupply: string
  // fareTotalEndingSupply: string
  // numberOfChatMessages: string
  // highestMintAmountBatchEntry: string
  // mostFareBurned: string
}

export class Round extends Schema implements IRound {
  @type('number') roundId: number
  @type('number') randomNum: number
  @type('number') startedAt: number
  @type('number') endedAt: number
  @type('string') randomEliminator: string
  @type('string') startedTxHash: string
  @type('string') endedTxHash: string
  @type('string') revealKey: string
  @type('string') randomHash: string
  @type('string') fullRandomNum: string
  @type('boolean') isTwoXElim: boolean
  @type('boolean') isTenXElim: boolean
  @type('boolean') isHundoXElim: boolean
}
