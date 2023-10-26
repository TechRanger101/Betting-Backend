import type { IServiceObj } from '../types'
import createFareTokenListener from './fareToken'
import createSpinContractListener from './spinContract'
import { fareAPI, spinAPI } from '../../crypto'

import { EventNames } from '../constants'
import { type StoreQueue } from '../queue'
import { logger, sleep } from '../utils'

export default class SmartContractListener {
  #reconnectAttempts = 10
  #attemptInterval = 3_000
  #isReconnected = false
  service!: IServiceObj
  listeners!: ReturnType<typeof createFareTokenListener> &
    ReturnType<typeof createSpinContractListener>

  public get listenerCount() {
    return Object.keys(this.listeners).length
  }

  public get mountedListenerCount() {
    return fareAPI.contract.listenerCount() + spinAPI.contract.listenerCount()
  }

  constructor(service: IServiceObj, storeQueue: StoreQueue) {
    this.service = service
    this.listeners = {
      ...createFareTokenListener(service, storeQueue),
      ...createSpinContractListener(service, storeQueue),
    }
  }

  private async beforeStart() {
    await this.service.round.ensureSpinRoundPaused()
    await this.service.contractMode.ensureGameModes()
    await this.service.fareTransfer.updateTotalSupply()
    await this.service.round.updateCurrentRoundId()
  }

  private async reconnect() {
    const attempts = [...Array(this.#reconnectAttempts).keys()]

    const promiseList = attempts.map(attempt => {
      return async () => {
        try {
          if (this.#isReconnected) return

          this.stop()

          await this.beforeStart()
          this.#mountListeners()
          this.#isReconnected = true
        } catch (err) {
          logger.warn(`Could not connect to blockchain. Retrying: attempt - #${attempt}`)
          await sleep(this.#attemptInterval)
        }
      }
    })

    for (const prom of promiseList) {
      await prom()
    }

    if (!this.#isReconnected) {
      // @NOTE: Need red alert notification here
      logger.error(new Error('Reconnection attempts exceeded. Something is wrong!'))
      return
    }

    logger.info(`Provider has been reconnected successfully`)
    this.#isReconnected = false
  }

  #mountListeners() {
    // Fare
    fareAPI.contract.on(EventNames.Transfer, this.listeners.fareTransfer)

    // Spin
    spinAPI.contract.on(EventNames.ContractModeUpdated, this.listeners.contractModeUpdated)
    spinAPI.contract.on(EventNames.EntrySubmitted, this.listeners.entrySubmitted)
    spinAPI.contract.on(EventNames.RoundConcluded, this.listeners.roundConcluded)
    spinAPI.contract.on(EventNames.EntrySettled, this.listeners.entrySettled)
    spinAPI.contract.on(EventNames.RoundPausedChanged, this.listeners.roundPausedChanged)
    spinAPI.contract.on(EventNames.BatchEntriesSettled, this.listeners.batchEntriesSettled)
    spinAPI.contract.on(EventNames.NewRoundStarted, this.listeners.newRoundStarted)
    spinAPI.contract.on(EventNames.BatchEntryWithdraw, this.listeners.batchEntryWithdraw)
    // @NOTE: Need to implement NFTMint event
    // spinAPI.contract.on(EventNames.NFTMint, this.listeners.nftWon)

    // @NOTE: Perhaps this event won't be needed since we already get the random number from roundConcluded
    // spinAPI.contract.on(EventNames.RandomNumberRequested, (...args) => console.log(args))
  }

  async start() {
    try {
      await this.beforeStart()

      this.#mountListeners()
    } catch (err) {
      logger.error(err)
      this.reconnect()
    }
  }

  stop() {
    fareAPI.contract.removeAllListeners()
    spinAPI.contract.removeAllListeners()
  }
}
