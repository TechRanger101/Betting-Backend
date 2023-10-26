// @NOTE: Need to implement later

// import { Room, ServerError } from '@colyseus/core'
// import type { Client } from '@colyseus/core'
// import { Dispatcher } from '@colyseus/command'

// import { MediaStreamState, MediaUser, ScreenShare } from '../state/MediaStreamState'
// import PearMessages from '../types/message.types'

// const { NEW_SCREEN_SHARE, STOP_SCREEN_SHARE, TOGGLE_SCREEN_SHARE } = PearMessages

// abstract class MediaStream {
// 	abstract state: MediaStreamState
// 	abstract onMessage<T = any>(
// 		messageType: string | number,
// 		callback: (client: Client, message: T) => void
// 	): any

// 	defineMediaStreamMessages() {
// 		this.onMessage<string>(NEW_SCREEN_SHARE, (client, peerId) => {
// 			if (!this.state.screenShares.has(client.sessionId)) {
// 				const newScreenShare = new ScreenShare(peerId, 'need_public_address')
// 				this.state.screenShares.set(client.sessionId, newScreenShare)
// 			}
// 		})

// 		this.onMessage<boolean>(TOGGLE_SCREEN_SHARE, (client, isOn) => {
// 			if (this.state.screenShares.has(client.sessionId)) {
// 				this.state.screenShares.get(client.sessionId).isScreenSharing = isOn
// 			}
// 		})

// 		this.onMessage(STOP_SCREEN_SHARE, client => {
// 			if (!this.state.screenShares.has(client.sessionId)) {
// 				this.state.screenShares.delete(client.sessionId)
// 			}
// 		})
// 	}
// }

// class MediaStreamDef extends Room<MediaStreamState> {
// 	maxClients = 100
// 	private name: string
// 	private desc: string
// 	private password: string | null = null
// 	private dispatcher = new Dispatcher(this)

// 	onCreate(options: any) {
// 		console.log('CREATED MEDIA STREAM')

// 		this.setState(new MediaStreamState())
// 		const { name, desc, password } = options
// 		this.name = name
// 		this.desc = desc
// 		this.password = password
// 		this.autoDispose = false

// 		this.onMessage(NEW_SCREEN_SHARE, (client, peerId: string) => {
// 			if (!this.state.screenShares.has(client.sessionId)) {
// 				const newScreenShare = new ScreenShare(peerId, 'need_public_address')
// 				this.state.screenShares.set(client.sessionId, newScreenShare)
// 			}
// 		})

// 		this.onMessage(TOGGLE_SCREEN_SHARE, (client, isOn: boolean) => {
// 			if (this.state.screenShares.has(client.sessionId)) {
// 				this.state.screenShares.get(client.sessionId).isScreenSharing = isOn
// 			}
// 		})

// 		this.onMessage(STOP_SCREEN_SHARE, client => {
// 			if (!this.state.screenShares.has(client.sessionId)) {
// 				this.state.screenShares.delete(client.sessionId)
// 			}
// 		})
// 	}

// 	static async onAuth(client: any, options) {
// 		// Validate token and get publicAddress for hashmap reference
// 		// const { publicAddress } = await PearHash.decodeJwt(options.authToken)
// 		// if (!publicAddress) {
// 		//     throw new ServerError(400, 'Invalid access token.')
// 		// }

// 		// const playerStore = await PlayerService.model.findOne(
// 		//     {
// 		//         publicAddress,
// 		//     },
// 		//     '_id username publicAddress'
// 		// ) // @NOTE: Need to assign and return session token here

// 		// if (!playerStore) {
// 		//     throw new ServerError(400, 'Invalid access token.')
// 		// }

// 		// return playerStore.publicAddress
// 		if (!options.authToken) {
// 			throw new ServerError(400, 'Invalid access token.')
// 		}
// 		return options.authToken
// 	}

// 	onJoin(client: Client, options: any) {
// 		this.state.connectedUsers.set(
// 			client.sessionId,
// 			new MediaUser({
// 				publicAddress: options.authToken,
// 				nickName: 'Something',
// 				callId: options.callId,
// 			})
// 		)
// 	}

// 	onLeave(client: Client) {
// 		if (this.state.connectedUsers.has(client.sessionId)) {
// 			this.state.connectedUsers.delete(client.sessionId)
// 		}
// 		if (this.state.screenShares.has(client.sessionId)) {
// 			this.state.screenShares.delete(client.sessionId)
// 		}
// 	}

// 	// onDispose() {
// 	// }
// }

// export default MediaStream
