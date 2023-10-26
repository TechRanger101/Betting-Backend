import type { BigNumber } from 'ethers'

import type { Eliminator } from '../schema/types'

import ServiceBase from './ServiceBase'
import { spinAPI } from '../../crypto'
import { ensureNumber } from '../utils'

export default class EliminatorService extends ServiceBase<Eliminator> {
  public async fetchByRound(roundId: BigNumber | number) {
    return this.repo.search().where('roundId').equal(ensureNumber(roundId)).returnFirst()
  }

  public async createEliminatorsByRoundId(
    jobId: string,
    eventLogId: string,
    _roundId: BigNumber | number,
    timestamp = Date.now()
  ) {
    const roundId = ensureNumber(_roundId)
    const eliminators = await spinAPI.getAllEliminatorsByRound(ensureNumber(roundId))

    const promiseList = eliminators.map(
      ({ contractModeId, recordedExpectedValueFloor, isEliminator }) => {
        return this.repo.createAndSave({
          jobId,
          eventLogId,
          roundId,
          contractModeId: ensureNumber(contractModeId),
          recordedExpectedValueFloor: ensureNumber(recordedExpectedValueFloor),
          isEliminator,
          timestamp,
        })
      }
    )

    return Promise.all(promiseList)
  }
}
