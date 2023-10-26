import { Entity, Schema } from 'redis-om'

export interface User {
  jobId?: string
  publicAddress: string
  username?: string
  email?: string
  colorTheme?: string // @NOTE: Need to define enum for colorTheme
  sessionId: string // @NOTE: If value is present, the user is actually connected to the websocket
  // @NOTE: If reauth and sessionId exists, wipe sessionId and replace with new sessionId
  // @NOTE: If this event happens, invalidate sessionId and redirect user to connect wallet
  // @NOTE: keep list of 'sessionIds' and check on JWT validate if sessionId exists in list, return false
  createdAt: number // Unix timestamp when the user signed up
  lastAuthed: number // Unix timestamp when the user last logged in
  nonce: string // Nonce sent to the client for the user to sign. This value is updated every time the user authenticates.
  isDisabled: boolean // If true, the user is required to reauthicate
  lastUsernameChangeTimestamp: number
  // @NOTE: Need to add referal properties to track referals
  // referredBy: string // UUID or slug

  // @NOTE: Add latency property for users in ms
}

export class User extends Entity {}

// PlayerSchema.pre('save', async function hashPasswordCb(next) {
// 	try {
// 		this.updatedAt = new Date()

// 		if (!this.isModified('password')) {
// 			return next()
// 		}

// 		const hashedPassword = await PearHash.hash(this.password)

// 		this.password = hashedPassword
// 		return next()
// 	} catch (err) {
// 		return next(new Error(err.toString()))
// 	}
// })

export default new Schema(
  User,
  {
    // @NOTE: Need to implement unique constraint for publicAddress, username, email fields
    // @NOTE: Need to implement min and max length for username field
    // @NOTE: Need to implement email validation for email field
    jobId: { type: 'string' },
    publicAddress: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
    colorTheme: { type: 'string' },
    sessionId: { type: 'string' },
    createdAt: { type: 'number' },
    lastAuthed: { type: 'number' },
    nonce: { type: 'string' },
    isDisabled: { type: 'boolean' },
    lastUsernameChangeTimestamp: { type: 'number' },
  },
  { dataStructure: 'JSON' }
)
