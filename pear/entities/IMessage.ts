export interface IMessage {
  id: string // Random id (shortId)
  text: string // @NOTE: May need to do parsing to handle emojis
  createdBy: string // User's public address
  username: string // User's username
  colorTheme: string // User's colorScheme
  timestamp: string // Unix timestamp
  actorNumber: string
}
