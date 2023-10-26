import { Schema, ArraySchema, type } from '@colyseus/schema'
// import { Schema, ArraySchema, Context, type } from '@colyseus/schema'

import { Entry } from './Entry'

// const type = Context.create()

export interface IBatchEntry {
  roundId: number // Round when batchEntry was submitted
  batchEntryId: number // References the position of batchEntry array in smart contract
  player: string // Public address of player
  username: string // Player username
  settled: boolean // Determines if a player has submitted an batchEntrySettled transaction to claim token
  placedAt: number
  placedTxHash: string
  totalEntryAmount: string // Amount(sum of all entries) won when round is over
  totalMintAmount?: string // Amount(sum of all minting entries) won when round is over
  timestamp: number
  entries: ArraySchema<Entry>
  isBurn: boolean // Defaults to false
}

// @NOTE: This data should probably be fetched whenever someone clicks on a batchEntry
// @NOTE: We could alternatively push a slimmer data view and you can click for more detail
export class BatchEntry extends Schema implements IBatchEntry {
  @type('number') roundId: number
  @type('number') batchEntryId: number
  @type('string') player: string
  @type('string') username: string
  @type('string') placedTxHash: string
  @type('boolean') settled = false
  @type('string') totalEntryAmount: string
  @type('string') totalMintAmount?: string // Updated when round is over
  @type('number') timestamp: number
  @type('number') placedAt: number
  @type([Entry]) entries = new ArraySchema<Entry>()
  @type('boolean') isBurn: boolean // Defaults to false
}
