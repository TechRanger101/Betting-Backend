import Fastify from 'fastify'
import { utils } from 'ethers'
import fastifyCors from '@fastify/cors'
import { nanoid } from 'nanoid/async'
import { authOverrideToken } from '../../config/transport.config'
import store from '../../store'
import { EventNames } from '../../store/constants'
import { PearHash, ensureString } from '../../store/utils'
import PubSub from '../../pubsub'
import logger from '../../utils/logger'

const fast = Fastify({
  logger: true,
})
await fast.register(fastifyCors, {
  origin: true,
})

fast.get('/health-check', async (_req, reply) => {
  reply.code(200).send('OK')
})

fast.post<{ Body: { publicAddress: string } }>('/auth/generate-nonce', async req => {
  const { publicAddress } = req.body

  const { nonce, signingMessage } = await store.service.user.authPublicAddress(publicAddress)

  return { nonce, signingMessage }
})

fast.post<{ Body: { publicAddress: string; signature: string } }>(
  '/auth/verify-signature',
  async req => {
    const { publicAddress, signature } = req.body

    const { nonce, signingMessage, username } = await store.service.user.getUserNonce(publicAddress)

    const addressFromSignature = utils.verifyMessage(signingMessage, signature)

    // Signature is valid
    if (addressFromSignature.toLowerCase() === publicAddress.toLowerCase()) {
      const createdJwt = PearHash.generateJwt({
        publicAddress,
        nonce,
      })

      // Update user lastAuthed timestamp
      await store.service.user.userAuthed(addressFromSignature)

      // @NOTE: Generate unique sessionId and update userEntity here

      // @NOTE: Ensure user has AVAX (and/or) FARE balances
      await store.queue.user.add(EventNames.EnsureBalance, addressFromSignature)

      return { token: createdJwt, username: ensureString(username) }
    }
  }
)

fast.post<{ Headers: { token: string } }>('/auth/verify-token', async req => {
  const { token } = req.headers
  const publicAddress = PearHash.getAddressFromToken(token)

  // @NOTE: Need to check if token is expired here
  // @NOTE: If token is invalid or expired send a message to client to clear out token in localStorage
  if (!publicAddress) {
    throw new Error('Public address does not exist.')
  }

  // const doesExist = await store.service.user.exists(publicAddress)

  // @NOTE: Need to send message to client to redirect user to connect wallet and reverify
  // if (!doesExist) {
  //   throw new Error('User does not exist')
  // }
  const userEntity = await store.service.user.getUserEntity(publicAddress)

  if (!userEntity) {
    throw new Error('User does not exist')
  }

  // @NOTE: we could save a lastVerifiedAt field to update repo everytime token is verified

  // @NOTE: Ensure user has AVAX (and/or) FARE balances
  // @NOTE: Need to create a faucet function that checks users balances and ensures tokens
  // await store.queue.user.add(EventNames.EnsureBalance, publicAddress)

  return { publicAddress, username: ensureString(userEntity.username) }
})

fast.post<{
  Headers: { token: string }
  Body: {
    dedicated_server_key: string
    dedicated_server_prover: string
    auth_token: string
    auth_override_token: string
  }
}>('/auth-metaverse/verify-token', async req => {
  const { auth_override_token, auth_token, dedicated_server_key, dedicated_server_prover } =
    req.body
  const { lobby, session } = req.query as { lobby: string; session: string }

  const successResp = { ResultCode: 1, UserId: `dedicated-server_${lobby}--${session}` }
  const authFailedResp = { ResultCode: 2, Message: 'Authentication failed. Wrong credentials.' }
  const invalidParamsResp = { ResultCode: 3, Message: 'Invalid parameters.' }

  // TODO: Need to setup custom RSA public/private key authentication for dedicated server
  if (
    dedicated_server_key === 'tallahasse' &&
    dedicated_server_prover === 'supkip' &&
    auth_override_token === authOverrideToken
  ) {
    return successResp
  }

  if (Boolean(auth_override_token) && auth_override_token === authOverrideToken) {
    const overrideUserId = await nanoid(12)
    successResp.UserId = `admin-${overrideUserId}`
    return successResp
  }

  if (auth_token) {
    const publicAddress = PearHash.getAddressFromToken(auth_token)

    // @NOTE: Need to check if token is expired here
    // @NOTE: If token is invalid or expired send a message to client to clear out token in localStorage
    if (!publicAddress) {
      return authFailedResp
    }

    const doesExist = await store.service.user.exists(publicAddress)

    // @NOTE: Need to send message to client to redirect user to connect wallet and reverify
    if (!doesExist) {
      return authFailedResp
    }

    successResp.UserId = publicAddress

    // Success auth
    return successResp
  }

  return invalidParamsResp
})

fast.post<{ Headers: { token: string }; Body: { username: string; colorTheme: string } }>(
  '/auth/set-user-data',
  async req => {
    const { token } = req.headers
    const { username, colorTheme } = req.body

    const publicAddress = PearHash.getAddressFromToken(token)

    await store.service.user.setUserData(publicAddress, {
      username,
      colorTheme,
    })

    if (publicAddress && username) {
      PubSub.pub<'username-changed'>('user-update', 'username-changed', {
        publicAddress: utils.getAddress(publicAddress),
        username,
      }).catch(logger.error)
    }

    return { message: 'User data was updated!' }
  }
)

fast.post<{ Headers: { token: string } }>('/auth/logout', async req => {
  const { token } = req.headers
  const decodedToken = PearHash.decodeJwt(token)
  // @NOTE: Need to check if token is expired here
  // @NOTE: If token is invalid or expired send a message to client to clear out token in localStorage
  if (!decodedToken.publicAddress) {
    throw new Error('Token is invalid')
  }

  const doesExist = await store.service.user.exists(decodedToken.publicAddress)

  // @NOTE: Need to send message to client to redirect user to connect wallet and reverify
  if (!doesExist) {
    throw new Error('User does not exist')
  }

  // @NOTE: Need to add logic to invalidate the previous JWT token
  await store.service.user.logout(decodedToken.publicAddress)

  return { message: 'User has been successfully logged out' }
})

fast.get<{ Headers: { token: string } }>('/spin/claimable-rewards', async req => {
  const { token } = req.headers
  const publicAddress = PearHash.getAddressFromToken(token)

  const claimables = await store.service.batchEntry.fetchClaimableRewards(publicAddress)
  const claimablesJson = claimables.map(be => ({
    mintAmount: be.totalMintAmount,
    roundId: be.roundId,
  }))

  return { claimables: claimablesJson }
})

export default fast
