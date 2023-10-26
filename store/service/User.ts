import { utils } from 'ethers'
import validator from 'validator'

import type { User } from '../types'

import ServiceBase from './ServiceBase'
import {
  USERNAME_CHANGE_COOLDOWN_HOURS,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../constants'
import { PearHash, logger, isValidUsername } from '../utils'
import { spinAPI } from '../../crypto'

const { isEmail } = validator

export default class UserService extends ServiceBase<User> {
  // Fetch userEntity by publicAddress
  public async getUserByAddress(publicAddress: string) {
    return this.repo.search().where('publicAddress').eq(publicAddress).returnFirst()
  }

  public async getUserByUsername(username: string) {
    return this.repo.search().where('username').eq(username).returnFirst()
  }

  public async getUserBySessionId(sessionId: string) {
    return this.repo.search().where('sessionId').eq(sessionId).returnFirst()
  }

  // Check if publicAddress exists.
  // If true, generate a new nonce, update the player record, and return the nonce
  // If false, generate a new nonce, create a new player record, and return the none
  public async authPublicAddress(_publicAddress: string) {
    const publicAddress = utils.getAddress(_publicAddress).toLowerCase() // Normalize the public address
    const { nonce, signingMessage } = PearHash.generateNonceWithSigningMessage()

    const userEntity = await this.getUserByAddress(publicAddress)

    // If userEntity doesn't exist, create a new user entity and pass in generated nonce
    if (!userEntity) {
      await this.repo.createAndSave({
        publicAddress,
        nonce,
        isDisabled: false,
        createdAt: Date.now(),
      })

      logger.info(`Generated new player record for: ${publicAddress}`)

      // else update nonce for current user
    } else {
      userEntity.nonce = nonce
      await this.repo.save(userEntity)

      logger.info(`Updated nonce for player: ${publicAddress}, ${userEntity.entityId}`)
    }

    return { nonce, signingMessage }
  }

  // Fetch userEntity nonce by publicAddress
  public async getUserNonce(publicAddress: string) {
    if (!utils.isAddress(publicAddress)) throw new Error('Public address is not valid')

    const userEntity = await this.getUserByAddress(publicAddress)

    if (!userEntity) {
      throw new Error(`User does not exist with publicAddress: ${publicAddress}`)
    }

    return {
      nonce: userEntity.nonce,
      signingMessage: `${PearHash.getSigningMsgText()}${userEntity.nonce}`,
      username: userEntity.username,
    }
  }

  public async userAuthed(publicAddress: string) {
    const userEntity = await this.getUserByAddress(publicAddress)
    userEntity.lastAuthed = Date.now()
    return this.repo.save(userEntity)
  }

  // Checks if user exists by publicAddress
  public async exists(publicAddress: string) {
    const count = await this.repo.search().where('publicAddress').eq(publicAddress).returnCount()

    return count > 0
  }

  public async getUserEntity(publicAddress: string) {
    const userEntity = await this.getUserByAddress(publicAddress)
    return userEntity
  }

  public async logout(publicAddress: string) {
    const userEntity = await this.getUserByAddress(publicAddress)

    userEntity.sessionId = ''

    return this.repo.save(userEntity)
  }

  public async doesUsernameExist(username: string) {
    const userEntity = await this.getUserByUsername(username)

    return !!userEntity
  }

  public async getUserFromToken(token: string) {
    const publicAddress = PearHash.getAddressFromToken(token)
    return this.getUserByAddress(publicAddress)
  }

  public async updateUserSessionId(publicAddress: string, sessionId: string) {
    const userEntity = await this.getUserByAddress(publicAddress)
    userEntity.sessionId = sessionId
    return this.repo.save(userEntity)
  }

  public async clearOutSessionId(sessionId: string): Promise<string | null> {
    const userEntity = await this.getUserBySessionId(sessionId)
    if (!userEntity) return null

    userEntity.sessionId = null
    return this.repo.save(userEntity)
  }

  public async isUserInSpinRound(publicAddress: string, roundId: number) {
    try {
      const batchEntry = await spinAPI.contract.batchEntryMap(String(roundId), publicAddress)
      return batchEntry.placedAt.gt(0)
    } catch (err) {
      logger.error(err)
    }
  }

  canChangeUsername(lastChangedTimestamp: number) {
    const currentTime = Date.now()
    const elaspedTime = currentTime - lastChangedTimestamp
    const elaspedHours = elaspedTime / (1000 * 60 * 60)
    const canChange = elaspedHours >= USERNAME_CHANGE_COOLDOWN_HOURS

    return {
      elaspedHours,
      canChange,
    }
  }

  public async setUserData(
    publicAddress: string,
    {
      username: _username,
      email,
      colorTheme: _colorTheme,
    }: { username?: string; email?: string; colorTheme?: string }
  ) {
    const userEntity = await this.getUserByAddress(publicAddress)
    const colorTheme = _colorTheme

    if (!userEntity) throw new Error('User does not exist.')

    if (email) {
      if (!isEmail(email)) {
        throw new Error('Invalid email address')
      }
    }
    if (_username) {
      const username = _username.trim()
      if (!isValidUsername(username)) {
        throw new Error(
          `Username is invalid. Valid format: [a-zA-Z0-9_] | Min: ${USERNAME_MIN_LENGTH} | Max: ${USERNAME_MAX_LENGTH}`
        )
      }
      const canChangeObj = this.canChangeUsername(userEntity.lastUsernameChangeTimestamp)
      if (!canChangeObj.canChange) {
        throw new Error(
          `You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_HOURS} hours. Please wait ${(
            USERNAME_CHANGE_COOLDOWN_HOURS - canChangeObj.elaspedHours
          ).toFixed(1)} more hours before changing your username again.`
        )
      }
      const doesExist = await this.doesUsernameExist(username)
      if (doesExist) throw new Error('Username already exists.')

      userEntity.username = username
      userEntity.lastUsernameChangeTimestamp = Date.now()
    }

    if (colorTheme) {
      userEntity.colorTheme = colorTheme
    }

    userEntity.email = email || userEntity.email

    return this.repo.save(userEntity)
  }
}
