import { EventNames } from '../constants'

export type EventReturnData<T> = {
  eventName: EventNames
  data: T
}
