// General
export enum RoomName {
  Metaverse = 'Metaverse',
  Lobby = 'Lobby',
  Spin = 'Spin',
  Spin2 = 'Spin2',
  ChatRoom = 'ChatRoom',
  MediaStream = 'MediaStream',
}

export const MAX_CHAT_MESSAGE_LENGTH = 140
export const MAX_SPIN_CLIENTS = 2500

// Import/Exports
export * from './HttpStatusCodes'
export * from './WebSocketStatusCodes'
export * from './SpinRoom'
