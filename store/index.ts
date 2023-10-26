import { createClient } from 'redis'
import { Client } from 'redis-om'

import StoreWorker from './worker'
import SmartContractListener from './listener'
import { logger } from './utils'
import storeQueue, { StoreQueue } from './queue'
import {
  BatchEntryService,
  EntryService,
  EventLogService,
  FareTransferService,
  ContractModeService,
  RoundService,
  UserService,
  EliminatorService,
  RandomnessService,
  ChatMessageService,
} from './service'
import { IRepoObj, IServiceObj } from './types'

// Schemas
import {
  batchEntrySchema,
  entrySchema,
  eventLogSchema,
  fareTransferSchema,
  contractModeSchema,
  roundSchema,
  userSchema,
  eliminatorSchema,
  randomnessSchema,
  chatMessageSchema,
} from './schema'

import { redisUri, RedisDBIndex } from '../config'

export class RedisStore {
  redisBaseUri: string
  omUrl: string
  redis!: ReturnType<typeof createClient>
  om!: Client
  repo: IRepoObj = {}
  service: IServiceObj = {}
  queue!: StoreQueue
  worker!: StoreWorker
  listener!: SmartContractListener

  constructor(_redisUri = redisUri) {
    this.redisBaseUri = _redisUri
    this.omUrl = `${this.redisBaseUri}/${RedisDBIndex.Default}`
    this.redis = createClient({ url: this.omUrl })
  }

  async initialize(_runAfterConnect = true) {
    if (this.om?.isOpen) return this.om

    await this.redis.connect()
    logger.info('Connection to RedisStore established!')

    this.om = await new Client().use(this.redis)
    logger.info('Attached RedisClient instance to RedisOM instance')

    await this.initServices()
    logger.info('Services have been constructed!')

    await this.initRepos(this.om)
    const repoCount = Object.keys(this.repo).length
    logger.info(`Repos, Entities, and Indexes validated! (${repoCount} repos)`)

    logger.info(`RedisStore initialization finished!`)

    // Method ran after RedisClient connection is established
    // await this.afterConnect()

    return this.om
  }

  // private async afterConnect() {
  // }

  private async initRepos(om: Client) {
    this.repo.eliminator = await this.service.eliminator.init(om, eliminatorSchema)
    this.repo.eventLog = await this.service.eventLog.init(om, eventLogSchema)
    this.repo.contractMode = await this.service.contractMode.init(om, contractModeSchema)
    this.repo.fareTransfer = await this.service.fareTransfer.init(om, fareTransferSchema)
    this.repo.entry = await this.service.entry.init(om, entrySchema)
    this.repo.batchEntry = await this.service.batchEntry.init(om, batchEntrySchema)
    this.repo.round = await this.service.round.init(om, roundSchema)
    this.repo.user = await this.service.user.init(om, userSchema)
    this.repo.randomness = await this.service.randomness.init(om, randomnessSchema)
    this.repo.chatMessage = await this.service.chatMessage.init(om, chatMessageSchema)
  }

  private async initServices() {
    this.service.eliminator = new EliminatorService()
    this.service.eventLog = new EventLogService()
    this.service.contractMode = new ContractModeService()
    this.service.fareTransfer = new FareTransferService()
    this.service.entry = new EntryService()
    this.service.batchEntry = new BatchEntryService(this.service.entry)
    this.service.round = new RoundService(
      this.service.contractMode,
      this.service.batchEntry,
      this.service.entry
    )
    this.service.user = new UserService()
    this.service.randomness = new RandomnessService()
    this.service.chatMessage = new ChatMessageService()
  }

  async initQueue() {
    if (!this.queue) {
      this.queue = storeQueue
      logger.info(`StoreQueues have been initialized!`)
    }

    if (!this.worker) {
      this.worker = new StoreWorker(this.service)
      await this.worker.start()
      const storeWorkerCount = Object.keys(this.worker.list).length
      logger.info(`StoreWorkers are up and running! (${storeWorkerCount} workers)`)
    }
  }

  async initSmartContractListeners() {
    try {
      this.listener = new SmartContractListener(this.service, this.queue)
      await this.listener.start()
      logger.info(`Smart contract listeners started! (${this.listener.listenerCount} listeners)`)
    } catch (err) {
      logger.error(
        new Error(
          `Smart contract listeners failed to connnect RPC blockchain node: ${err.toString}`
        )
      )
    }
  }

  async disconnectAll() {
    if (this.om?.isOpen) {
      await this.om.close()
    }
  }
}

const redisStore = new RedisStore()

export default redisStore
