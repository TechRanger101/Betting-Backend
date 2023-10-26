import EventEmitter from 'eventemitter3'

export type LocalEventName = 'server-starting' | 'server-started' | 'server-stopping'

export const LocalEvent = new EventEmitter()

export const emitLocalEvent = <T>(eventName: LocalEventName, payload: T) => {
  return LocalEvent.emit(eventName, payload)
}

export const onLocalEvent = <T>(eventName: LocalEventName, callback: (args: T) => void) => {
  return LocalEvent.on(eventName, callback)
}
