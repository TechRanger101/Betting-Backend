import { Client } from '@colyseus/core'

import { Logger } from '../../utils'

export const logger = Logger.create({ logType: 'Pear', theme: ['neonGreen'] })

export function findClientBySessionId(sessionId: string, clients: Client[]): Client | null {
  const client = clients.filter(c => c.sessionId === sessionId)[0] || null

  return client
}
