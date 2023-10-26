export enum SpinEvent {
  /** Spin timer seconds updated */
  TimerUpdated = 'TimerUpdated',
  /** User sent new chat message */
  NewChatMessage = 'NewChatMessage',
  NewGameChatMessage = 'NewGameChatMessage',
  /** Only sent to a single guest client on connect (passes guestId) */
  GuestUserJoined = 'GuestUserJoined',
  /** Initial spin room data */
  SendRoomData = 'SendRoomData',
  UsernameUpdated = 'UsernameUpdated',
}

export const MAX_CHAT_MSGS = 50

export enum ChatMessage {
  NewChatMessage = 'NewChatMessage',
}

export enum MediaStreamMessage {
  NEW_SCREEN_SHARE = 'NewScreenShare',
  TOGGLE_SCREEN_SHARE = 'ToggleScreenShare',
  STOP_SCREEN_SHARE = 'StopScreenShare',
}
