import { MapSchema, ArraySchema } from '@colyseus/schema'
import { Room } from '@colyseus/core'
import { SpinState } from '../state/SpinState'

export class SpinRoom extends Room<SpinState> {
  currentCountdown: number
}

export interface IGuestPlayer {
  guestUsername: string
  pearBalance?: string
  depositBalance?: string
  queueBalance?: string
}

export interface IGamePlayer {
  publicAddress: string
  ethBalance?: string
  pearBalance?: string
  depositBalance?: string
  queueBalance?: string
  prizeBalance?: string
}

export interface IEntry {
  publicAddress?: string
  roundId: string
  amount: string
  pickedColor: string
  isSettled: boolean
  result: string
  mintAmount: string
}

export interface IEntryList {
  list: ArraySchema<IEntry>
}

export interface ISpinContractState {
  gamePlayers: MapSchema<IGamePlayer>
  guestPlayers: MapSchema<IGuestPlayer>
  entries: MapSchema<IEntryList>
  pearSupply: string
  currentRoundId: string
  roundStarted: boolean
  vrfNum: string
}
