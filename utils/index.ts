export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms))

export function randomizer(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Import/exports
export * from './logger'
export * from './event'
