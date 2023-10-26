import type { BigNumber } from 'ethers'

import type { Randomness } from '../schema/types'

import ServiceBase from './ServiceBase'
import { ensureNumber } from '../utils'

export default class RandomnessService extends ServiceBase<Randomness> {
  public async fetchByRound(roundId: BigNumber | number) {
    return this.repo.search().where('roundId').equal(ensureNumber(roundId)).returnFirst()
  }

  public async getRandomess(roundId: number) {
    return this.repo.search().where('roundId').equal(roundId).returnFirst()
  }

  public async createOrReturn(data: Partial<Randomness>) {
    const doesRoundIdExist = await this.repo
      .search()
      .where('roundId')
      .equal(data.roundId)
      .returnFirst()
    if (doesRoundIdExist) {
      return doesRoundIdExist
    }

    return this.repo.createAndSave(data as any)
  }
}
