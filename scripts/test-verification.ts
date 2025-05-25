import { createPublicClient, http, parseEther, createWalletClient } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { TokenFactory } from '../typechain-types'
import { TokenFactory__factory } from '../typechain-types/factories/contracts/TokenFactory__factory'
import dotenv from 'dotenv'
import { execSync } from 'child_process'
import fs from 'fs'

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY
const TOKEN_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'bscTestnet'

if (!PRIVATE_KEY || !TOKEN_FACTORY_ADDRESS) {
  throw new Error('Missing required environment variables: PRIVATE_KEY or NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS')
}

let pk = PRIVATE_KEY || ''
if (!pk.startsWith('0x')) pk = '0x' + pk
const account = privateKeyToAccount(pk as `0x${string}`)

// Ensure factory address is correct type
let factoryAddress = TOKEN_FACTORY_ADDRESS
if (!factoryAddress.startsWith('0x')) factoryAddress = '0x' + factoryAddress
const FACTORY_ADDRESS = factoryAddress as `0x${string}`

const chain = NETWORK === 'bsc' ? bsc : bscTestnet

const publicClient = createPublicClient({
  chain,
  transport: http()
})

const walletClient = createWalletClient({
  account,
  chain,
  transport: http()
}) as any // Type assertion to fix writeContract error

async function main() {
  try {
    console.log('Starting token creation and verification test...')
    
    // Step 1: Create token
    console.log('\nStep 1: Creating token...')
    const tokenParams = {
      name: 'Byteory',
      symbol: 'BYTE',
      totalSupply: '1000000', 
      features: {
        antiBot: true,
        antiWhale: true
      },
      maxTxAmount: '10000', 
      taxEnabled: false,
      taxRecipients: [] as `0x${string}`[],
      taxPercentages: [] as bigint[]
    }

    const tokenFactory = {
      address: FACTORY_ADDRESS,
      abi: TokenFactory__factory.abi
    } as const

    const creationFee = await publicClient.readContract({
      ...tokenFactory,
      functionName: 'creationFee'
    })

    console.log('Creation fee:', creationFee.toString())

    const { request } = await publicClient.simulateContract({
      ...tokenFactory,
      functionName: 'createToken',
      args: [
        tokenParams.name,
        tokenParams.symbol,
        parseEther(tokenParams.totalSupply),
        tokenParams.features.antiBot,
        tokenParams.features.antiWhale,
        parseEther(tokenParams.maxTxAmount),
        tokenParams.taxEnabled,
        tokenParams.taxRecipients,
        tokenParams.taxPercentages
      ],
      value: creationFee,
      account
    })

    console.log('Sending transaction...')
    const hash = await walletClient.writeContract(request)
    console.log('Transaction hash:', hash)

    console.log('Waiting for transaction receipt...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('Transaction receipt:', receipt)

    // Extract token address from logs
    const tokenAddress = receipt.logs[0]?.address
    if (!tokenAddress) {
      throw new Error('Token address not found in logs')
    }
    console.log('Token created at:', tokenAddress)

    // Wait 3 minutes before verification
    console.log('Waiting 30 seconds before running verification...')
    await new Promise(resolve => setTimeout(resolve, 30_000))

    // Step 2: Verify contract using Hardhat
    console.log('\nStep 2: Verifying contract using Hardhat...')
    // IMPORTANT: The order and types of constructorArgs must match the Token contract's constructor exactly.
    // If you change the Token contract's constructor, update this array accordingly.
    const constructorArgs = [
      account.address,
      tokenParams.name,
      tokenParams.symbol,
      parseEther(tokenParams.totalSupply).toString(),
      tokenParams.features.antiBot,
      tokenParams.features.antiWhale,
      parseEther(tokenParams.maxTxAmount).toString(),
      tokenParams.taxEnabled,
      tokenParams.taxRecipients,
      tokenParams.taxPercentages
    ]
    console.log('Constructor arguments:', constructorArgs)

    // Write constructor args to args.js
    fs.writeFileSync('scripts/args.js', `module.exports = ${JSON.stringify(constructorArgs, null, 2)}\n`)

    // Run Hardhat verify task with --network from env
    const verifyCmd = [
      'yarn hardhat verify',
      `--network ${NETWORK}`,
      tokenAddress,
      '--constructor-args scripts/args.js'
    ].join(' ')
    console.log('Running:', verifyCmd)
    try {
      const output = execSync(verifyCmd, { stdio: 'inherit' })
      console.log('Verification output:', output?.toString?.() || '[output streamed above]')
    } catch (err) {
      console.error('Verification failed:', err)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

main()