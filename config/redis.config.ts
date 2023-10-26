import Redis from 'ioredis'
import type { WorkerOptions, QueueOptions, QueueEventsOptions } from 'bullmq'

export const {
  REDIS_PEAR_HOST,
  REDIS_PEAR_PORT,
  REDIS_PEAR_USERNAME,
  REDIS_PEAR_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_URI,
  NODE_ENV,
} = process.env

export enum RedisDBIndex {
  Default = 0,
  PubSub = 1,
  StateSync = 2,
  BullQueue = 3,
  Proxy = 4,
}

export const redisUri = REDIS_URI || 'redis://localhost:6379'
export const redisInstance = new Redis(redisUri)
export const redisOptions = redisInstance.options
export const bullmqInstance = new Redis(redisUri, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})
export const bullmqOptions = bullmqInstance.options

export const workerDefaultOpts: WorkerOptions = {
  connection: bullmqOptions,
  concurrency: 50,
  autorun: false, // Disable autorun so we can control when the workers are started
}

export const queueDefaultOpts: QueueOptions = {
  connection: bullmqOptions,
  // @NOTE: Look into different queueOpt configurations
}

export const queueEventDefaultOpts: QueueEventsOptions = {
  connection: bullmqOptions,
  // @NOTE: Look into different queueEventsOpts configurations
}
