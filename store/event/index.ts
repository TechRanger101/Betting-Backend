import { QueueEvents } from 'bullmq'

import { QueueNames } from '../constants'
import { queueEventDefaultOpts } from '../../config'

// Instantiate function to create a new queue event listener
export const FareEvent = () => new QueueEvents(QueueNames.FareContractEvent, queueEventDefaultOpts)
export const SpinEvent = () => new QueueEvents(QueueNames.SpinContractEvent, queueEventDefaultOpts)
