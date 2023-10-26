import type { IServiceObj } from '../../types'
import CryptoToken from '../../../crypto/admin/token'
import { workerLogger as logger } from '../../utils'

const fund = new CryptoToken({})

const createUserJobProcess = (_service: IServiceObj) => {
  async function ensureUserHasAvaxFare(address: string) {
    const transferType = await fund.ensureBalance(address)
    logger.info(`Ensured balance for ${address.substring(0, 11)} --- transferType(${transferType})`)
  }

  return {
    ensureUserHasAvaxFare,
  }
}

export default createUserJobProcess
