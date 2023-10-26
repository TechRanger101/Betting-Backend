import { Schema, type } from '@colyseus/schema'
// import { Schema, Context, type } from '@colyseus/schema'

// const type = Context.create()

export interface IEntry {
  amount: string // Amount of FARE token submitted
  roundId: number // Round when this entry was submitted
  contractModeId: number // References the ContractMode mapping in the smart contract (0 = 2X, 1 = 10X, 2 = 100X)
  pickedNumber: number // Number picked for the specific contractMode
  player: string // Players public address
  entryIdx: number // References position in entry array in smart contract
  mintAmount?: string // Amount won when round is over
  settled: boolean // Determines if a player has submitted an batchEntrySettled transaction to claim token
  isBurn: boolean
}

// @NOTE: This data should probably be fetched whenever someone clicks on a batchEntry
// @NOTE: We could alternatively push a slimmer data view and you can click for more detail
export class Entry extends Schema implements IEntry {
  @type('string') amount: string
  @type('number') roundId: number
  @type('number') contractModeId: number
  @type('number') pickedNumber: number
  @type('string') player: string
  @type('number') entryIdx: number
  @type('string') mintAmount?: string // Updates when round is over
  @type('boolean') settled = false // Defaults to false
  @type('boolean') isBurn: boolean // Defaults to false
}
