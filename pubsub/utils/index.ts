import { Logger } from '../../utils'

export const pubLogger = Logger.create({ logType: 'Pub', theme: ['mexicanBrown'] })
export const subLogger = Logger.create({ logType: 'Sub', theme: ['lightGreen'] })

/* eslint-disable */
export const hashStr = (s: string) =>
	s
		.split('')
		.reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0)
			return a & a
		}, 0)
		.toString()
