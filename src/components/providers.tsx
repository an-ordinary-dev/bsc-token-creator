"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { createAppKit } from "@reown/appkit/react"
import { config } from "@/lib/wagmi"
import { bsc, bscTestnet } from '@reown/appkit/networks'
import { wagmiAdapter } from "@/lib/wagmi"

const queryClient = new QueryClient()

// Set up metadata
const metadata = {
  name: 'BSC Token Creator',
  description: 'Create and deploy your BSC token in just a few minutes',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Initialize AppKit
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'bscTestnet'
const appkitNetworks =
  NETWORK === 'bsc'
    ? [bsc] as [typeof bsc]
    : [bscTestnet] as [typeof bscTestnet];

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  networks: appkitNetworks,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ["x", "discord", "apple"],
    // Optionally: connectMethodsOrder: ["wallet", "email", "social"]
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 