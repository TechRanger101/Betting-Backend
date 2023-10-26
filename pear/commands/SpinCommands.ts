import { utils } from 'ethers'
import numeral from 'numeral'
import shortId from 'shortid'
import { nanoid } from 'nanoid'
import { Command } from '@colyseus/command'
import type { Client } from '@colyseus/core'

import type SpinRoom from '../rooms/SpinRoom'
import type {
  FareTransferArgs,
  BatchEntryMsgArgs,
  SettledRound,
  INewRoundStarted,
} from '../../pubsub/types'
import { ENTRIES_OPEN_COUNTDOWN_DURATION } from '../../crypto/admin/constants'

import store from '../../store'
import {
  SpinEvent,
  MAX_CHAT_MESSAGE_LENGTH,
  WebSocketCustomCodes,
  MAX_CHAT_MSGS,
} from '../constants'
import { Entry, BatchEntry, Round, type IMessage, type IGameMessage } from '../entities'
import { logger } from '../utils'

// @NOTE: Needed commands
// OnFetchFareSupply
// OnFetchRoundAnalytics

// @NOTE: Define types for options
export class OnFareTransfer extends Command<SpinRoom, FareTransferArgs> {
  execute({ to, from, amount, timestamp: _timestamp }: FareTransferArgs) {
    try {
      const toUser = this.state.users.get(to)
      const fromUser = this.state.users.get(from)
      // @NOTE: Need to add transfer listener for avax amount
      if (toUser) {
        const bnBalance = utils.parseEther(toUser.balance.fare)
        const bnAmount = utils.parseEther(amount)
        toUser.balance.fare = utils.formatEther(bnBalance.add(bnAmount))
      }
      if (fromUser) {
        const bnBalance = utils.parseEther(fromUser.balance.fare)
        const bnAmount = utils.parseEther(amount)
        fromUser.balance.fare = utils.formatEther(bnBalance.sub(bnAmount))
      }
    } catch (err) {
      logger.error(err)
    }
  }
}

type OnGameChatMessageOpts = { text: string; client: Client }
export class OnGameChatMessage extends Command<SpinRoom, OnGameChatMessageOpts> {
  async execute({ text: _text, client }: OnGameChatMessageOpts) {
    if (client.userData?.publicAddress) {
      const canSendMessage = store.service.chatMessage.messageLimiter.handleMessage(
        client.userData?.publicAddress,
        _text
      )
      if (!canSendMessage) {
        client.error(
          WebSocketCustomCodes.USER_MESSAGE_TIMEOUT,
          'You are sending messages too fast. Please slow down.'
        )
        return
      }
    }
    // Reject guest users from sending messages
    if (client.userData?.guestId) {
      client.error(WebSocketCustomCodes.RESTRICTED_USER_ACTION, 'Guest users cannot send messages.')
      return
    }
    const text = (_text || '').trim()
    if (!text || text.length === 0) {
      client.error(
        WebSocketCustomCodes.MESSAGE_VALIDATION_ERROR,
        'Cannnot send empty chat message.'
      )
      return
    }

    if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
      client.error(
        WebSocketCustomCodes.MESSAGE_VALIDATION_ERROR,
        `Message too long (max length: ${MAX_CHAT_MESSAGE_LENGTH})`
      )
      return
    }

    let clientUser = this.state.users.get(client.sessionId)
    if (!clientUser) {
      client.error(
        WebSocketCustomCodes.RESTRICTED_USER_ACTION,
        'User doesnt have an active session'
      )
      return
    }

    let newMsg: IGameMessage = {
      id: nanoid(),
      text,
      username: clientUser.username || '',
      createdBy: clientUser.publicAddress,
      timestamp: Date.now(),
    }

    this.room.chatMessages.push(newMsg)

    if (this.room.chatMessages.length > MAX_CHAT_MSGS) {
      this.room.chatMessages.shift()
    }

    const msgJSON = JSON.stringify(newMsg)

    logger.info(msgJSON)

    this.room.broadcast(SpinEvent.NewGameChatMessage, msgJSON, { except: client })

    store.service.chatMessage
      .addChatMessage(newMsg)
      .then(() => logger.info(`Saved chat message from ${newMsg.createdBy} - ${text}`))
      .catch(logger.error)
  }
}

type OnNewChatMessageOpts = { text: string; client: Client }
export class OnNewChatMessage extends Command<SpinRoom, OnNewChatMessageOpts> {
  async execute({ text: _text, client }: OnNewChatMessageOpts) {
    const text = (_text || '').trim()
    if (!text) return

    let clientUser = this.state.users.get(client.sessionId)
    let newMsg: IMessage

    if (!client.userData.networkActorNumber) {
      client.error(
        WebSocketCustomCodes.RESTRICTED_USER_ACTION,
        'User does not have network actorNumber'
      )
      return
    }

    if (!clientUser) {
      newMsg = {
        id: shortId(),
        text: text || '',
        username:
          client.userData?.networkUsername || `Guest ${client.userData.guestId || shortId()}`,
        createdBy: client.userData?.networkUsername || String(client.userData.guestId || ''),
        colorTheme: 'default',
        timestamp: Date.now().toString(),
        actorNumber: client.userData?.networkActorNumber,
      }
    } else {
      newMsg = {
        id: shortId(),
        text,
        username: clientUser.username || '',
        createdBy: clientUser.publicAddress,
        colorTheme: clientUser.colorTheme,
        timestamp: Date.now().toString(),
        actorNumber: client.userData?.networkActorNumber,
      }
    }

    // if (!client.auth) {
    // 	client.error(
    // 		WebSocketCustomCodes.RESTRICTED_USER_ACTION,
    // 		'Guests cannot send chat messages.'
    // 	)
    // 	return
    // }

    if (text.length === 0) {
      client.error(
        WebSocketCustomCodes.MESSAGE_VALIDATION_ERROR,
        'Cannnot send empty chat message.'
      )
      return
    }

    if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
      client.error(
        WebSocketCustomCodes.MESSAGE_VALIDATION_ERROR,
        `Message too long (max length: ${MAX_CHAT_MESSAGE_LENGTH})`
      )
      return
    }

    logger.info(`New chat message from ${newMsg.createdBy} - ${text}`)

    const msgJSON = JSON.stringify(newMsg)

    logger.info(msgJSON)

    this.room.broadcast(SpinEvent.NewChatMessage, msgJSON, { except: client })
  }
}

export class OnInitSpinRoom extends Command<SpinRoom, void> {
  async execute() {
    this.state.fareTotalSupply = await store.service.fareTransfer.getCachedTotalSupply()
    this.state.currentRoundId = Number(await store.service.round.getCachedCurrentRoundId())
    this.state.isRoundPaused = await store.service.round.getCachedSpinRoundPaused()
    this.state.roomStatus = await store.service.round.getSpinRoomStatus()
    this.state.countdownTotal = ENTRIES_OPEN_COUNTDOWN_DURATION / 1000
    const batchEntryData = await store.service.batchEntry.getCurrentRoundBatchEntries()
    const roundData = await store.service.round.fetch(this.state.currentRoundId)
    const chatMessages = await store.service.chatMessage.getRecentChatMessages()

    this.room.chatMessages.push(...chatMessages)

    if (roundData) {
      const round = new Round()
      round.roundId = roundData.roundId
      round.randomHash = roundData.randomHash
      round.revealKey = roundData.revealKey
      round.fullRandomNum = roundData.fullRandomNum
      round.startedAt = new Date(roundData.startedAt).getTime()
      round.endedAt = new Date(roundData.endedAt).getTime()
      round.randomHash = roundData.randomHash
      round.randomNum = roundData.randomNum
      round.randomEliminator = roundData.randomEliminator
      this.room.spinTick = round.randomNum || 0
      this.state.spinTick = round.randomNum || 0

      this.state.round.set(String(this.state.currentRoundId), round)
    }

    batchEntryData.forEach(({ batchEntry, entries }) => {
      const batchEntryState = new BatchEntry()
      batchEntryState.roundId = batchEntry.roundId
      batchEntryState.placedAt = batchEntry.placedAt
      batchEntryState.placedTxHash = batchEntry.placedTxHash
      batchEntryState.batchEntryId = batchEntry.batchEntryId
      batchEntryState.player = batchEntry.player
      batchEntryState.settled = batchEntry.settled
      batchEntryState.totalEntryAmount = batchEntry.totalEntryAmount
      batchEntryState.totalMintAmount = batchEntry.totalMintAmount
      batchEntryState.timestamp = batchEntry.timestamp
      batchEntryState.isBurn = false

      entries.forEach(entry => {
        const entryState = new Entry()

        entryState.amount = entry.amount
        entryState.roundId = entry.roundId
        entryState.contractModeId = entry.contractModeId
        entryState.pickedNumber = entry.pickedNumber
        entryState.entryIdx = entry.entryIdx
        entryState.mintAmount = entry.mintAmount
        entryState.settled = entry.settled
        entryState.isBurn = false

        batchEntryState.entries.push(entryState)
      })

      this.state.batchEntries.set(batchEntryState.player, batchEntryState)
    })
  }
}

export class OnFareTotalSupplyUpdated extends Command<SpinRoom, string> {
  async execute(fareTotalSupply: string) {
    logger.info(`New fareTotalSupply: ${fareTotalSupply} FARE`)
    this.state.fareTotalSupply = fareTotalSupply
  }
}

export class OnBatchEntry extends Command<SpinRoom, BatchEntryMsgArgs> {
  execute({ batchEntry, entries }: BatchEntryMsgArgs) {
    try {
      // @NOTE: Look this over later
      if (!batchEntry || !entries || !batchEntry.player) {
        return
      }

      logger.info(
        `OnBatchEntry -> ${batchEntry.player.substring(0, 11)} - Amount: ${numeral(
          batchEntry.totalEntryAmount
        ).format('0,0.00')} - Entry count: ${entries.length}`
      )

      // Get username from sessionIdUserMap
      const userSessionId = this.room.sessionIdUserMap.get((batchEntry.player || '').toLowerCase())
      let playerDisplayName: string
      if (userSessionId) {
        const user = this.state.users.get(userSessionId)
        // Set username if it exists
        if (user && user.username) {
          playerDisplayName = user.username
        }
      }

      const batchEntryState = new BatchEntry()
      batchEntryState.roundId = batchEntry.roundId
      batchEntryState.placedAt = batchEntry.placedAt
      batchEntryState.placedTxHash = batchEntry.placedTxHash
      batchEntryState.batchEntryId = batchEntry.batchEntryId
      batchEntryState.player = batchEntry.player
      batchEntryState.username = playerDisplayName
      batchEntryState.settled = batchEntry.settled
      batchEntryState.totalEntryAmount = batchEntry.totalEntryAmount
      batchEntryState.totalMintAmount = batchEntry.totalMintAmount
      batchEntryState.timestamp = batchEntry.timestamp
      batchEntryState.isBurn = false

      entries.forEach(entry => {
        const entryState = new Entry()

        entryState.amount = entry.amount
        entryState.roundId = entry.roundId
        entryState.contractModeId = entry.contractModeId
        entryState.pickedNumber = entry.pickedNumber
        entryState.entryIdx = entry.entryIdx
        entryState.mintAmount = entry.mintAmount
        entryState.settled = entry.settled
        entryState.isBurn = false

        batchEntryState.entries.push(entryState)
      })

      this.state.batchEntries.set(batchEntryState.player, batchEntryState)

      // If player is actively in room ensure their state is set to isInRound
      store.service.user.getUserByAddress(batchEntry.player).then(user => {
        if (!user) return
        const stateUser = this.state.users.get(user.sessionId)
        if (stateUser) {
          stateUser.isInRound = true
        }
      })
    } catch (err) {
      logger.error(err)
    }
  }
}

export class OnResetRound extends Command<SpinRoom, void> {
  execute() {
    const keys = this.state.batchEntries.keys()
    for (let key of keys) {
      this.state.batchEntries.delete(key)
    }
    logger.info(`Round has been reset`)
  }
}

export class OnRoundConcluded extends Command<SpinRoom, SettledRound> {
  execute(roundData: SettledRound) {
    const round = this.state.round.get(String(this.state.currentRoundId))
    if (!round) {
      logger.warn(`Could not find round ${roundData.roundId} inside SpinRoom round map.`)
      return
    }

    round.roundId = roundData.roundId
    round.randomHash = roundData.randomHash
    round.revealKey = roundData.revealKey
    round.fullRandomNum = roundData.fullRandomNum
    round.startedAt = roundData.startedAt
    round.endedAt = roundData.endedAt
    round.randomHash = roundData.randomHash
    round.randomNum = roundData.randomNum
    round.randomEliminator = roundData.randomEliminator

    // Set eliminator results
    round.isTwoXElim = roundData.isTwoXElim
    round.isTenXElim = roundData.isTenXElim
    round.isHundoXElim = roundData.isHundoXElim

    // Set mintAmount for call batchEntries/entries
    roundData.settledData.forEach(({ batchEntry, entries }) => {
      const be = this.state.batchEntries.get(batchEntry.player)
      if (!be) return

      const deltaAmount = Number(batchEntry.totalMintAmount) - Number(be.totalEntryAmount)
      if (deltaAmount < Number(be.totalEntryAmount)) {
        be.isBurn = true
      }

      be.totalMintAmount = batchEntry.totalMintAmount
      be.settled = true

      be.entries.forEach((e, idx) => {
        if (entries[idx].mintAmount) {
          e.mintAmount = entries[idx].mintAmount
        } else {
          e.isBurn = true
        }
      })
    })

    this.state.round.set(String(roundData.roundId), round)
    this.state.round.delete(String(this.state.currentRoundId - 2)) // Remove rounds older than 3 rounds ago

    this.state.currentRoundId += 1
  }
}

export class OnNewRoundStarted extends Command<SpinRoom, INewRoundStarted> {
  execute(roundData: INewRoundStarted) {
    console.log(roundData)
    const round = new Round()
    round.roundId = roundData.roundId
    round.randomHash = roundData.randomHash
    round.startedAt = roundData.startedAt
    this.state.round.set(String(roundData.roundId), round)
  }
}
