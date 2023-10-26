import Redis, { ClientContext } from 'ioredis'
import type { RedisOptions, Callback, Result } from 'ioredis'

import type { ChannelName, MessageListener, FirstArgument } from './types'
import { pubLogger, subLogger } from './utils'
import { PubSubChannel } from './constants'
import { redisUri } from '../config'

declare module 'ioredis' {
  interface Redis {
    channel: ChannelName
    messageName: keyof MessageListener
    patternName: string
    logger: typeof subLogger
    sub(
      ...args: [...patterns: string[], callback: Callback<unknown>]
    ): Result<unknown, ClientContext>
    onSub: Callback<unknown>
    unsub(callback: Callback<unknown>): any
    isSubbed: boolean
    listen<T extends keyof MessageListener>(listener: MessageListener[T], ...args: any[]): this
    shutdown(): Promise<string>
  }
}

// Duplicates existing sub instance with passed in params and bind to channel
function RedisSub(
  ioRedisSub: Redis,
  channel: ChannelName,
  messageName: keyof MessageListener,
  overrideRedisOpts: RedisOptions,
  onSub?: Callback<unknown>
) {
  const subInstance = ioRedisSub.duplicate(overrideRedisOpts)
  subInstance.channel = channel
  subInstance.messageName = messageName
  subInstance.patternName = `${subInstance.channel}.${subInstance.messageName}`
  subInstance.logger = subLogger
  subInstance.onSub = () => {
    if (onSub) return onSub()
    return subInstance.logger.info(
      `Created new RedisSub instance to channel/topic(s): ${subInstance.patternName}`
    )
  }
  subInstance.sub = () => {
    subInstance.isSubbed = true
    return subInstance.subscribe(subInstance.patternName, subInstance.onSub)
  }
  subInstance.unsub = cb => {
    subInstance.isSubbed = false
    return subInstance.unsubscribe(subInstance.patternName, cb)
  }
  subInstance.listen = <L extends typeof messageName>(listener: MessageListener[L]) => {
    return subInstance.on('message', (_channel, data: string, ...args) => {
      listener(JSON.parse(data), ...args)
    })
  }
  subInstance.shutdown = async () => {
    subInstance.logger.info(`Quitting RedisSub instance for channel(s): ${subInstance.patternName}`)
    return subInstance.quit()
  }
  return subInstance
}

export default abstract class PubSub {
  static #pub: Redis
  static #sub: Redis
  static #redisUri = redisUri
  static #subInstance: { [channel: string]: ReturnType<typeof RedisSub> } = {}
  logger = pubLogger
  Channels = PubSubChannel

  // Create only one pub instance. If already created return the created instance.
  static async pub<T extends keyof MessageListener>(
    channel: ChannelName,
    messageName: keyof MessageListener,
    data: FirstArgument<MessageListener[T]>
  ) {
    if (!this.#pub) {
      this.#pub = new Redis(this.#redisUri)
      pubLogger.info('New RedisPub instance created!')
    }
    const patternName = `${channel}.${messageName}`

    await this.#pub.publish(patternName, JSON.stringify(data))

    return this.#pub
  }

  // Creates a new instance for every channel that is defined
  // If multiple subscriptions are created return the duplicated instance
  static sub(
    channel: ChannelName,
    messageName: keyof MessageListener,
    onSub?: Callback<unknown>,
    overrideRedisOpts?: RedisOptions
  ) {
    const patternName = `${channel}.${messageName}`
    if (!this.#sub) {
      this.#sub = new Redis(this.#redisUri)
    }

    if (!this.#subInstance[patternName]) {
      this.#subInstance[patternName] = RedisSub(
        this.#sub,
        channel,
        messageName,
        overrideRedisOpts,
        onSub
      )
      this.#subInstance[patternName].sub(this.#subInstance[patternName].onSub)
    }

    return this.#subInstance[patternName]
  }

  //   static async startAll() {
  // if (this.#pub) this.#pub.quit()
  // if (this.#sub) this.#sub.quit()
  // const promiseList = Object.values(this.#subInstance).map(
  // 	subInstance => subInstance.shutdown
  // )
  // await Promise.all(promiseList)
  //   }

  static async stopAll() {
    if (this.#pub) await this.#pub.quit()
    if (this.#sub) await this.#sub.quit()
    const promiseList = Object.values(this.#subInstance).map(subInstance => subInstance.shutdown)
    await Promise.all(promiseList)
  }
}
