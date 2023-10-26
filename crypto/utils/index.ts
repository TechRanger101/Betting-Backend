import { type providers, utils, BigNumber } from 'ethers'
import numeral from 'numeral'

import type { FlatEntry } from '../types'
import { Logger } from '../../utils'

export const logger = Logger.create({ logType: 'Crypto', theme: ['gold'] })

export const BNToNumber = (bn: BigNumber, decimals = 0) => Number(utils.formatUnits(bn, decimals))

export const prettyNumber = (num: number | string | BigNumber, decimals = 18) => {
  if (num instanceof BigNumber) {
    const _num = utils.formatUnits(num, decimals)
    return numeral(_num).format('(0,0)')
  }

  return numeral(num).format('(0,0)')
}

export const BN = BigNumber.from

export const ensureNumber = (val: BigNumber | number): number =>
  val instanceof BN ? BNToNumber(val as BigNumber) : (val as number)

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

export const getRevertedReason = async (
  transtionHash: string,
  provider: providers.JsonRpcProvider
) => {
  const tx = await provider.getTransaction(transtionHash)
  try {
    let code = await provider.call(tx, tx.blockNumber)
    return code
  } catch (err: any) {
    const code = err.data.replace('Reverted ', '')
    logger.error(err)
    let reason = utils.toUtf8String('0x' + code.substr(138))
    logger.info('Revert reason:', reason)
    return reason
  }
}

export function os2ip(X: Buffer) {
  /*
    OS2IP converts an octet string to a nonnegative integer.
    Input:  X octet string to be converted
    Output:  x corresponding nonnegative integer
    Steps:
      1.  Let X_1 X_2 ... X_xLen be the octets of X from first to last,
          and let x_(xLen-i) be the integer value of the octet X_i for 1
          <= i <= xLen.
      2.  Let x = x_(xLen-1) 256^(xLen-1) + x_(xLen-2) 256^(xLen-2) +
          ...  + x_1 256 + x_0.
      3.  Output x.
  */

  const x = Buffer.from(X)
    .reverse()
    .reduce(
      (total, value, index) => (total += BigInt(value) * BigInt(256) ** BigInt(index)),
      BigInt(0)
    )
  return x
}
