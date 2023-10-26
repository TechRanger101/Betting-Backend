import fs from 'fs'
import { exec } from 'node:child_process'
import { Wallet, providers } from 'ethers'
import { logger } from '../utils'
import cryptoConfig from '../../config/crypto.config'

const { blockchainRpcUrl } = cryptoConfig

const provider = new providers.JsonRpcProvider(blockchainRpcUrl)

/** Class that generates private keys, create seed provider instances, and manage crypto seed data */
export default class CryptoSeed {
  #seedPath = `${process.cwd()}/crypto/admin/seed`
  #privateKeys: string[] = []
  #publicKeys: string[] = []
  #signers: Wallet[] = []

  get seedPath() {
    return this.#seedPath
  }

  get publicKeys() {
    return this.#publicKeys
  }

  get signers() {
    return this.#signers
  }

  async init(fileName = 'default') {
    if (this.#signers.length !== 0) return
    const seedFilePath = `${this.seedPath}/${fileName}.seed`
    let data = ''
    try {
      data = fs.readFileSync(seedFilePath, { encoding: 'utf8' })
    } catch (e) {
      this.#ensureSeedFile(fileName)
    }
    let privateKeys: string[] = []

    if (!data) {
      privateKeys = await this.createSeedAccounts()
      logger.info('Seed private key file empty. Generated new keys.')
    } else {
      privateKeys = JSON.parse(data) as string[]
      logger.info('Fetched existing seed private keys.')
    }

    this.#signers = privateKeys.map(privKey => new Wallet(privKey, provider))

    this.#publicKeys = this.#signers.map(signer => signer.address)
  }

  async getPrivateKeys(fileName = 'default') {
    const seedFilePath = `${this.seedPath}/${fileName}.seed`
    const data = fs.readFileSync(seedFilePath, { encoding: 'utf8' })
    let privateKeys: string[] = []

    if (!data) {
      privateKeys = await this.createSeedAccounts()
    } else {
      privateKeys = JSON.parse(data) as string[]
    }

    return privateKeys
  }

  deleteSeedPath() {
    fs.rmdirSync(this.seedPath)
  }

  #ensureSeedDir() {
    if (!fs.existsSync(this.seedPath)) fs.mkdirSync(this.seedPath)
  }

  #ensureSeedFile(fileName = 'default') {
    const seedFilePath = `${this.seedPath}/${fileName}.seed`
    if (!fs.existsSync(seedFilePath)) {
      fs.openSync(seedFilePath, 'w')
      fs.writeFileSync(seedFilePath, '')
    }
  }

  #addToSeedFile(privateKeys: string[], fileName = 'default') {
    const seedFilePath = `${this.seedPath}/${fileName}.seed`
    const data = fs.readFileSync(seedFilePath, { encoding: 'utf8' })

    let fileData = ''

    if (data) {
      const parsedData = JSON.parse(data) as string[]
      const combinedPrivateKeys = [...parsedData, ...privateKeys]
      this.#privateKeys = combinedPrivateKeys
      fileData = JSON.stringify(combinedPrivateKeys)
    } else {
      this.#privateKeys = privateKeys
      fileData = JSON.stringify(privateKeys)
    }

    fs.writeFileSync(seedFilePath, fileData, 'utf8')

    this.#signers = this.#privateKeys.map(privKey => new Wallet(privKey, provider))

    this.#publicKeys = this.#signers.map(signer => signer.address)

    return this.#publicKeys
  }

  async generatePrivateKey(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec('openssl rand -hex 32', (error, stdout, stderr) => {
        if (error) reject(error)
        if (stderr) reject(stderr)
        resolve(`0x${stdout.trim()}`)
      })
    })
  }

  async createSeedAccounts(count = 25, newFileName?: string) {
    this.#ensureSeedDir() // Create seed directory if it doesn't exist
    this.#ensureSeedFile(newFileName)

    const counts = [...Array(count).keys()]
    const promiseList = counts.map(() => this.generatePrivateKey())

    const privateKeys = await Promise.all(promiseList)

    this.#addToSeedFile(privateKeys, newFileName)

    return privateKeys
  }
}
