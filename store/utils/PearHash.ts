import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { utils } from 'ethers'

import { SIGNING_MESSAGE_TEXT } from '../constants'
import { saltRounds, jwtExpiration } from '../../config'

const jwtPubKeyPath = `${path.resolve('')}/keys/jwtRS256.key.pub`
const jwtPrivKeyPath = `${path.resolve('')}/keys/jwtRS256.key`

const pubKey = await fs.readFile(jwtPubKeyPath)
const privKey = await fs.readFile(jwtPrivKeyPath)

export type JWTDecodedData = {
  publicAddress: string
  nonce: string
}

export default abstract class PearHash {
  static async hash(password: string) {
    const salt = await bcrypt.genSalt(Number(saltRounds))

    return bcrypt.hash(password, salt)
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, (err: any, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  static generateJwt(data: JWTDecodedData) {
    // @NOTE: Generate PEM RSA public/private key for generating JWT
    const authToken = jwt.sign(data, privKey, {
      expiresIn: jwtExpiration,
      algorithm: 'RS256',
    })

    return authToken
  }

  static decodeJwt(token: string) {
    // @NOTE: Generate PEM RSA public/private key for verifying
    try {
      const decoded = jwt.verify(token, pubKey, {
        algorithms: ['RS256'],
      }) as JWTDecodedData

      return decoded
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'jwt malformed')
          throw new Error('Invalid auth token. Please reauthenticate and try again.')
      }
      throw err
    }
  }

  static getAddressFromToken(token: string) {
    const decoded = this.decodeJwt(token)

    return decoded.publicAddress
  }

  static fromUtf8ToHex(str: string) {
    return utils.hexlify(utils.toUtf8Bytes(str))
  }

  static generateNonce() {
    return uuidv4()
  }

  static generateNonceHex() {
    return this.fromUtf8ToHex(uuidv4())
  }

  static getSigningMsgText() {
    return SIGNING_MESSAGE_TEXT
  }

  static generateNonceWithSigningMessage() {
    const nonce = this.generateNonceHex()

    return {
      nonce,
      signingMessage: `${SIGNING_MESSAGE_TEXT}${nonce}`,
    }
  }
}
