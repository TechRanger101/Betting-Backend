import { utils, BigNumber, type Overrides } from 'ethers'

import type { FlatEntry } from '../../types'
import { Logger } from '../../../utils'

export const logger = Logger.create({ logType: 'CryptoAdmin', theme: ['mexicanBrown'] })

export const BN = BigNumber.from

export function createEntry(amount: number, contractModeId: 0 | 1 | 2, pickedNumber: number) {
  return {
    amount: utils.parseEther(amount.toString()),
    contractModeId: BN(contractModeId),
    pickedNumber: BN(pickedNumber),
  }
}

export function createBatchEntry(entries: FlatEntry[]) {
  return entries.map(entry => createEntry(...entry))
}

/* eslint-disable */
export function randomHexString(bits: number) {
  if (bits === undefined) {
    bits = 64
  }

  if (!Number.isInteger(bits) || bits < 1) {
    throw new Error('Invalid number of bits to generate. Bits must be a positive integer.')
  }

  const nibbles = Math.floor(bits / 4)
  const remainder = bits % 4
  let hex = ''

  if (remainder) {
    hex = Math.floor(Math.random() * (1 << remainder)).toString(16)
  }

  for (let i = 0; i < nibbles; i++) {
    hex += Math.floor(Math.random() * 15).toString(16)
  }

  return `0x${hex}`
}

export const retryPromise = async <T>(fn: () => Promise<T>, retriesLeft = 5): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retriesLeft === 0) {
      throw error
    }
    return retryPromise(fn, retriesLeft - 1)
  }
}

export async function delayAfterPromise(promise: Promise<any>, minWaitMs = 3000) {
  const start = Date.now()
  await promise
  const elapsed = Date.now() - start
  const remaining = minWaitMs - elapsed
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining))
  }
}

export function adjustTxGasOverrides(
  gasLimitIncrease: number,
  gasPriceIncrease: number,
  overrides: Overrides
): Overrides {
  let newGasLimit = (overrides.gasLimit as number) ?? 0
  let newGasPrice = (overrides.gasPrice as number) ?? 0

  if (!newGasLimit && !newGasPrice) return overrides

  return {
    ...overrides,
    gasLimit: newGasLimit + gasLimitIncrease,
    gasPrice: newGasPrice + gasPriceIncrease,
  }
}
