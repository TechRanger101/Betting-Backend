import { utils } from 'ethers'
import type { ContractModeParams } from '../types/spin.types'
import { BN } from '../utils'

export const AVAX_FLOOR = utils.parseEther('0.25')
export const AVAX_FAUCET_AMOUNT = utils.parseEther('1')
export const FARE_FLOOR = utils.parseEther('50000')
export const FARE_FAUCET_AMOUNT = utils.parseEther('1000000')

export const Bytes32Zero = '0x0000000000000000000000000000000000000000000000000000000000000000'

// @NOTE: This object should only be used for testing
// @NOTE: If actually using ContractMode, fetch all active ContractModes from smart contract
export const ContractModes: ContractModeParams[] = [
  {
    id: BN(0),
    cardinality: BN(2),
    mintMultiplier: BN(2),
    contractExpectedValueFloor: BN('980321568627440000'), // 2 out of 102 eliminator ticks
    minAmount: BN(0),
    maxAmount: BN(0),
    entryLimit: BN(1),
    isActive: true,
  },
  {
    id: BN(1),
    cardinality: BN(10),
    mintMultiplier: BN(10),
    contractExpectedValueFloor: BN('970873786407767000'), // 3 out of 103 eliminator ticks
    minAmount: BN(0),
    maxAmount: BN(0),
    entryLimit: BN(5),
    isActive: true,
  },
  {
    id: BN(2),
    cardinality: BN(100),
    mintMultiplier: BN(100),
    contractExpectedValueFloor: BN('961538461538462000'), // 4 out of 104 eliminator ricks
    minAmount: BN(0),
    maxAmount: BN(0),
    entryLimit: BN(10),
    isActive: true,
  },
]
