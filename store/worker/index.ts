import { Worker } from 'bullmq'
import type { Job } from 'bullmq'

import type { IServiceObj } from '../types'
import { createFareJobProcesses, createSpinJobProcesses, createUserJobProcess } from './process'
import { QueueNames, EventNames } from '../constants'
import { workerDefaultOpts } from '../../config/redis.config'
import { sleep, workerLogger as logger } from '../utils'

export default class StoreWorker {
  fareWorker!: Worker
  spinWorker!: Worker
  userWorker!: Worker
  process: ReturnType<typeof createFareJobProcesses> &
    ReturnType<typeof createSpinJobProcesses> &
    ReturnType<typeof createUserJobProcess>

  constructor(service: IServiceObj) {
    // Pass in Redis Store service references and create processes
    this.process = {
      ...createFareJobProcesses(service),
      ...createSpinJobProcesses(service),
      ...createUserJobProcess(service),
    }

    // Define workers below
    this.fareWorker = new Worker(
      QueueNames.FareContractEvent,
      this.handleFareContractJob.bind(this),
      workerDefaultOpts
    )

    this.spinWorker = new Worker(
      QueueNames.SpinContractEvent,
      this.handleSpinContractJob.bind(this),
      workerDefaultOpts
    )

    this.userWorker = new Worker(QueueNames.User, this.handleUserJob.bind(this), workerDefaultOpts)
  }

  public get list() {
    return {
      fareContractWorker: this.fareWorker,
      spinContractWorker: this.spinWorker,
      userWorker: this.userWorker,
    }
  }

  // #region Job Handlers
  handleUserJob(job: Job) {
    try {
      logger.info(`Process started: ${job.name} - ${Date.now()}`)
      switch (job.name) {
        case EventNames.EnsureBalance:
          return this.process.ensureUserHasAvaxFare(job.data)
        default:
          throw new Error(`[Worker]: Invalid eventName ${job.name}`)
      }
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  handleFareContractJob(job: Job) {
    try {
      logger.info(`Process started: ${job.name} - ${Date.now()}`)
      switch (job.name) {
        case EventNames.Transfer:
          return this.process.fareTransfer(job.data, job.id)
        default:
          throw new Error(`[Worker]: Invalid eventName ${job.name}`)
      }
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  handleSpinContractJob(job: Job) {
    try {
      logger.info(`Process started: ${job.name} - ${Date.now()}`)
      switch (job.name) {
        case EventNames.ContractModeUpdated:
          return this.process.contractModeUpdated(job.data, job.id)
        case EventNames.EntrySubmitted:
          return this.process.entrySubmitted(job.data, job.id)
        case EventNames.RoundConcluded:
          return this.process.roundConcluded(job.data, job.id)
        case EventNames.EntrySettled:
          return this.process.entrySettled(job.data, job.id)
        case EventNames.NewRoundStarted:
          return this.process.newRoundStarted(job.data, job.id)
        case EventNames.BatchEntriesSettled:
          return this.process.batchEntriesSettled(job.data, job.id)
        default:
          throw new Error(`[Worker]: Invalid eventName ${job.name}`)
      }
    } catch (err) {
      logger.error(err)
      throw err
    }
  }
  // #endregion Job Handlers

  async start() {
    const workerKeys = Object.keys(this.list)

    const promiseList = workerKeys.map(async key => {
      return new Promise((resolve, reject) => {
        const worker: Worker = this.list[key]

        worker.run()

        const maxAttempts = 10
        let attempts = 0
        while (attempts < maxAttempts) {
          if (worker.isRunning()) {
            logger.info(`${key} waiting for jobs...`)
            break
          }

          attempts += 1
          sleep(500)
        }

        if (attempts >= maxAttempts) {
          logger.error(new Error(`[${key}]: Worker failed to start!`))
          reject(new Error(`[${key}]: Worker failed to start!`))
        }

        resolve(null)
      })
    })

    await Promise.all(promiseList)
  }

  async stop() {
    const workerKeys = Object.keys(this.list)

    const promiseList = workerKeys.map(async key => {
      const worker: Worker = this.list[key]
      await worker.close()
    })

    return Promise.all(promiseList)
  }
}
