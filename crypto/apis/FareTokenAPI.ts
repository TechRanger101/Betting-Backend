import ethers from 'ethers'

import { FareToken } from '../types'

const {
  utils: { formatEther },
} = ethers

class FareTokenAPI {
  public contract!: FareToken

  constructor(contract: FareToken) {
    this.contract = contract
  }

  public getAddress(): string {
    return this.contract.address
  }

  public async getByteCode(): Promise<string> {
    return this.contract.provider.getCode(this.getAddress())
  }

  public async getTotalSupply(): Promise<string> {
    const balance = formatEther(await this.contract.totalSupply())
    return balance
  }

  public async getFareBalance(address: string): Promise<string> {
    const balance = formatEther(await this.contract.balanceOf(address))
    return balance
  }

  public async getOwnerBalance(): Promise<string> {
    const balance = await this.getFareBalance(await this.contract.owner())
    return balance
  }

  public async getAvaxBalance(address: string): Promise<string> {
    const balance = formatEther(await this.contract.provider.getBalance(address))
    return balance
  }
}

export default FareTokenAPI
