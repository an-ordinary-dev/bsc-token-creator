import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, bscTestnet } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'bscTestnet'
const activeChain = NETWORK === 'bsc' ? bsc : bscTestnet

const bscTestnetRpcUrl = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545"
const bscRpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/"

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  networks: [activeChain],
  projectId
})

// Use the adapter's config
export const config = wagmiAdapter.wagmiConfig 