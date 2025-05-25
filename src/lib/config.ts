import { bsc, bscTestnet } from '@reown/appkit/networks'
import { config as wagmiConfig } from './wagmi'

export function getTokenFactoryAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS
  if (addr && addr.startsWith('0x')) return addr as `0x${string}`
  throw new Error('NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS is not set or invalid')
}

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'bscTestnet'
const activeChain = NETWORK === 'bsc' ? bsc : bscTestnet

export const networks = [activeChain]

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

export function getTokenImplementationAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_TOKEN_IMPLEMENTATION_ADDRESS
  if (addr && addr.startsWith('0x')) return addr as `0x${string}`
  throw new Error('NEXT_PUBLIC_TOKEN_IMPLEMENTATION_ADDRESS is not set or invalid')
}

export const SUPPORTED_CHAINS = {
  bsc: 56,
  bscTestnet: 97,
} as const

export const getChainId = () => {
  if (process.env.NEXT_PUBLIC_NETWORK === "bsc") {
    return SUPPORTED_CHAINS.bsc
  }
  return SUPPORTED_CHAINS.bscTestnet
}

export function getEtherscanApiUrl(): string {
  if (process.env.NEXT_PUBLIC_NETWORK === "bsc") return "https://api.bscscan.com/api"
  if (process.env.NEXT_PUBLIC_NETWORK === "bscTestnet") return "https://api-testnet.bscscan.com/api"
  // Default to BSC testnet if not set
  return "https://api-testnet.bscscan.com/api"
}