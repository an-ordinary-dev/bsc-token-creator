import { NextResponse } from 'next/server'

// Private RPC URLs - not exposed to frontend
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545"
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const txHash = searchParams.get('txHash')
    const network = searchParams.get('network') || 'testnet'

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 })
    }

    const rpcUrl = network === 'mainnet' ? BSC_RPC_URL : BSC_TESTNET_RPC_URL

    // Get transaction receipt
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    if (!data.result) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Get contract address from transaction receipt
    let contractAddress = data.result.contractAddress;

    // If contractAddress is not present (factory deployment), try to extract from logs
    if (!contractAddress && Array.isArray(data.result.logs) && data.result.logs.length > 0) {
      // Try to find the first log with a non-zero address (skip 0x000...)
      const logWithAddress = data.result.logs.find(
        (log: any) => log.address && log.address !== '0x0000000000000000000000000000000000000000'
      );
      if (logWithAddress) {
        contractAddress = logWithAddress.address;
      }
    }

    if (!contractAddress) {
      return NextResponse.json({ error: 'No contract address found in transaction' }, { status: 400 })
    }

    // Only return necessary information to frontend
    return NextResponse.json({
      contractAddress,
      network,
      // Don't expose RPC URL to frontend
    })
  } catch (error) {
    console.error('Error getting contract address:', error)
    return NextResponse.json({ error: 'Failed to get contract address' }, { status: 500 })
  }
} 