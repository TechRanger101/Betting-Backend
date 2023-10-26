import { utils, BigNumber } from 'ethers'
import numeral from 'numeral'
import type { Entity } from 'redis-om'

import type { SchemaAdditions } from '../types'
import { Logger } from '../../utils'
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } from '../constants'

export { default as PearHash } from './PearHash'

export const logger = Logger.create({ logType: 'RedisStore', theme: ['brightPink'] })
export const workerLogger = Logger.create({ logType: 'Worker', theme: ['pink'] })

// Definitions
// @NOTE: A lot of these should move to the crypto directory
export const zeroAddress = '0x0000000000000000000000000000000000000000'
export const formatETH = utils.formatEther
export const formatBN = (bn: BigNumber, decimals = 0) => utils.formatUnits(bn, decimals)
export const toEth = (bn: string) => utils.parseEther(bn)
export const BN = BigNumber.from
export const upperETHLimit = BN('1000000000')

export const prettyNum = (num: string | BigNumber) => {
  if (num instanceof BigNumber) {
    return numeral(formatBN(num)).format('0,0.00')
  }
  return numeral(num).format('0,0.00')
}

export const BNToNumber = (bn: BigNumber) => {
  try {
    return bn.toNumber()
  } catch (err) {
    logger.error(err)
    return Number(formatBN(bn))
  }
}

export const ensureNumber = (val: BigNumber | number): number =>
  val instanceof BN ? BNToNumber(val as BigNumber) : (val as number)

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms))

export function numify<T extends Entity>(obj: T & SchemaAdditions) {
  const newObj: any = {}

  if (!obj.timestamp) newObj.timestamp = Date.now()

  Object.keys(obj).forEach(key => {
    const val = obj[key]
    if (val instanceof BigNumber) {
      if (val.gt(upperETHLimit)) {
        newObj[key] = formatETH(obj[key])
      } else {
        newObj[key] = formatBN(obj[key])
      }
    } else {
      newObj[key] = obj[key]
    }
  })

  return newObj
}

export function bnify<T extends Entity>(obj: T & SchemaAdditions, includeKeys: string[] = []) {
  const newObj: any = Object.assign(obj, {
    bn: {},
  })
  const keys = [...includeKeys, ...obj.ethFields]
  keys.forEach(key => {
    if (obj[key]) {
      newObj.bn[key] = utils.parseUnits(String(obj[key]), 'wei')
    }
  })

  return newObj
}

// @NOTE: Define more username constraints
export function isValidUsername(username: string): boolean {
  // Define the regex pattern to match valid usernames
  const pattern = /^[a-zA-Z0-9-]{2,14}( [a-zA-Z0-9-]{1,14})*$/

  // Ensure the length of the username is between 4 and 16 characters
  const isValidLength =
    username.trim().length >= USERNAME_MIN_LENGTH && username.trim().length <= USERNAME_MAX_LENGTH

  // Use the test method of the RegExp object to match the pattern against the username string
  return pattern.test(username) && isValidLength
}

export function ensureString(value: unknown): string {
  if (value === null || value === undefined || typeof value !== 'string') {
    return ''
  }
  return value
}
