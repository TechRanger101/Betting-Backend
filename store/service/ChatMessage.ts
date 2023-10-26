import type { ChatMessage } from '../schema/types'

import ServiceBase from './ServiceBase'
import { MESSAGE_TIMEOUT_COUNT, MESSAGE_TIMEOUT_SECONDS } from '../constants'
import { IGameMessage } from '../../pear/entities'
import { MAX_CHAT_MSGS } from '../../pear/constants'
import logger from '../../utils/logger'

class MessageLimiter {
  private userMessageTimestamps: Map<string, number[]>
  private userTimeouts: Set<string>

  constructor() {
    this.userMessageTimestamps = new Map<string, number[]>()
    this.userTimeouts = new Set<string>()
  }

  public handleMessage(user: string, _message: string): boolean {
    if (this.userTimeouts.has(user)) {
      // User is timed out, ignore message
      return false
    }

    const now = Date.now()
    const messageTimestamps = this.userMessageTimestamps.get(user) || []

    // Remove timestamps older than 15 seconds
    const filteredTimestamps = messageTimestamps.filter(
      timestamp => now - timestamp <= MESSAGE_TIMEOUT_SECONDS
    )

    if (filteredTimestamps.length >= MESSAGE_TIMEOUT_COUNT) {
      // User sent more than 7 messages in 15 seconds, time them out
      logger.info(`User has been timed out for sending messages too fast ${user}`)
      this.userTimeouts.add(user)
      setTimeout(() => this.clearTimeout(user), MESSAGE_TIMEOUT_SECONDS)
      return false
    }
    // Update message timestamps
    filteredTimestamps.push(now)
    this.userMessageTimestamps.set(user, filteredTimestamps)
    return true
  }

  private clearTimeout(user: string): void {
    this.userTimeouts.delete(user)
  }
}

const messageLimiter = new MessageLimiter()

export default class ChatMessageService extends ServiceBase<ChatMessage> {
  public messageLimiter = messageLimiter

  async getRecentChatMessages(count = MAX_CHAT_MSGS) {
    const chatMessages = await this.repo.search().sortAsc('timestamp').returnPage(0, count)
    const list: IGameMessage[] = []
    for (const msg of chatMessages) {
      const jsonMsg = msg.toJSON() as IGameMessage
      jsonMsg.timestamp = Math.floor(new Date(jsonMsg.timestamp).getTime() / 1000)
      list.push(jsonMsg)
    }
    return list
  }

  async updateUsername(publicAddress: string, username: string) {
    const msgEntities = await this.repo
      .search()
      .where('createdBy')
      .equals(publicAddress)
      .returnAll()
    for (const msg of msgEntities) {
      msg.username = username
      await this.repo.save(msg)
    }
  }

  async addChatMessage(message: IGameMessage) {
    return this.repo.createAndSave(message as any)
  }
}
