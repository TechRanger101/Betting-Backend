import type { BigNumber, Event } from 'ethers'

import type { StoreQueue } from '../queue'
import type { IFareTransferQueue, IServiceObj } from '../types'
import { ContractNames, EventNames } from '../constants'
import { formatETH } from '../utils'

const createFareTokenListener = (service: IServiceObj, storeQueue: StoreQueue) => {
  const { eventLog } = service

  const fareTransfer = async (from: string, to: string, value: BigNumber, event: Event) => {
    const queueData: IFareTransferQueue = {
      from,
      to,
      amount: formatETH(value),
      timestamp: Date.now(),
      event: eventLog.parseForQueue(event, ContractNames.FareToken),
    }

    await storeQueue.fareContract.add(EventNames.Transfer, queueData)
  }

  return {
    fareTransfer,
  }
}

export default createFareTokenListener
