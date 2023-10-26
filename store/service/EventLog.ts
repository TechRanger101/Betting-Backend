import type { Event } from 'ethers'

import type { ContractNames } from '../constants'
import type { IEventLogQueue } from '../types'

import ServiceBase from './ServiceBase'
import { EventLog } from '../schema/eventLog'

export default class EventLogService extends ServiceBase<EventLog> {
  public parseForQueue(event: Event, contractName: ContractNames): IEventLogQueue {
    const parsedEvent: IEventLogQueue = {
      contractName,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      logIndex: event.logIndex,
      event: event.event,
      topics: event.topics,
      timestamp: Date.now(),
    }

    return parsedEvent
  }

  // If event doesn't exist, eventLog entity will be added to the EventLog repo
  // Returns empty string if eventLog already exists
  public async process(event: IEventLogQueue, contractName: ContractNames) {
    const doesExist = await this.repo
      .search()
      .where('transactionHash')
      .equals(event.transactionHash)
      .where('logIndex')
      .equals(event.logIndex)
      .returnCount()

    if (doesExist > 0) return ''

    const eventLogEntry = await this.repo.createAndSave({
      contractName,
      transactionHash: event.transactionHash,
      logIndex: event.logIndex,
      event: event.event,
      topics: event.topics,
      timestamp: Date.now(),
    })

    return eventLogEntry.entityId
  }
}
