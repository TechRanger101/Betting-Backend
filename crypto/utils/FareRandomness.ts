import { exec } from 'node:child_process'
import { BigNumber, utils } from 'ethers'
import Chance from 'chance'
import forge from 'node-forge'
import { keccak256 } from 'ethers/lib/utils'

import { os2ip } from '.'

const MAX_ETH_UINT_256 = 2 ** 256 - 1

export interface IFareVRFOptions {
  seed?: string
  mod?: number
}

export async function generatePrivateKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('openssl rand -hex 32', (error, stdout, stderr) => {
      if (error) reject(error)
      if (stderr) reject(stderr)
      resolve(`0x${stdout.trim()}`)
    })
  })
}

export type CommitRevealData = {
  hash: string
  salt: string
  randomNum: number
}

export const chance = new Chance(await generatePrivateKey())
export const abiCoder = new utils.AbiCoder()

/* VRF Standard IETF: https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/ */
export class FareRandomness {
  async getRandomBytes(bytes = 32, seed?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      forge.random.getBytes(bytes, (err, randomBytes) => {
        if (err) return reject(err)
        ;(forge.random as any).collect(randomBytes)
        if (seed) {
          ;(forge.random as any).collect(seed)
        }
        resolve(randomBytes)
      })
    })
  }

  async generateSalt() {
    const salt = generatePrivateKey()

    return salt
  }

  async generateHash(salt: string, randomNum: bigint) {
    const bnRandomNumber = BigNumber.from(randomNum)
    const encodedRandomNum = abiCoder.encode(['bytes32', 'uint256'], [salt, bnRandomNumber])
    const keccakRandomNum = keccak256(encodedRandomNum)
    return keccakRandomNum
  }

  bytesToHex(byteStr: string) {
    return forge.util.bytesToHex(byteStr)
  }

  async generateRandomness() {
    const bytes = 256
    // const randomSeed = chance.sentence({ words: 24 })
    // const randomBytes = await this.getRandomBytes(bytes, randomSeed)
    const randomBytes = await this.getRandomBytes(bytes)
    const randomBytesHex = this.bytesToHex(randomBytes)
    const sha256Md = forge.md.sha256.create()
    sha256Md.update(randomBytesHex, 'utf8')
    // sha256Md.update(randomSeed, 'utf8')
    const fullRandomNumber =
      os2ip(Buffer.from(sha256Md.digest().toHex())) % BigInt(MAX_ETH_UINT_256)
    const randomNum = fullRandomNumber % BigInt(100)

    // const encodedRandomNum = abiCoder.encode(['uint256', 'uint256'], [vrfNum, 1])
    // const keccakRandomNum = ethers.utils.keccak256(encodedRandomNum)
    return {
      randomBytesHex,
      randomBytes,
      // randomSeed,
      fullRandomNumber,
      randomNum,
    }
  }
}

const fareRandomness = new FareRandomness()

export default fareRandomness
