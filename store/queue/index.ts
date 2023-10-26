import { Queue } from 'bullmq'

import { QueueNames } from '../constants'
import { queueDefaultOpts } from '../../config'

export class StoreQueue {
  fareContract = new Queue(QueueNames.FareContractEvent, queueDefaultOpts)
  spinContract = new Queue(QueueNames.SpinContractEvent, queueDefaultOpts)
  user = new Queue(QueueNames.User, queueDefaultOpts)
}

export default new StoreQueue()
