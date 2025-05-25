import { AbiCoder } from "ethers"

export function encodeConstructorArguments(
  name: string,
  symbol: string,
  initialSupply: bigint,
  antiBot: boolean,
  antiWhale: boolean,
  airdropMode: boolean,
  maxTxAmount: bigint,
  initialOwner: string
): string {
  // Proper ABI encoding for Etherscan verification
  const abiCoder = new AbiCoder()
  const encoded = abiCoder.encode(
    [
      "string",  // name
      "string",  // symbol
      "uint256", // initialSupply
      "bool",    // antiBot
      "bool",    // antiWhale
      "bool",    // airdropMode
      "uint256", // maxTxAmount
      "address"  // initialOwner
    ],
    [
      name,
      symbol,
      initialSupply,
      antiBot,
      antiWhale,
      airdropMode,
      maxTxAmount,
      initialOwner
    ]
  )
  
  // Remove the 0x prefix and ensure proper formatting
  return encoded.slice(2)
} 