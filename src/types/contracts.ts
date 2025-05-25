import { type Address } from "viem"

export const TOKEN_FACTORY_ABI = [
  {
    inputs: [
      { name: "_creationFee", type: "uint256" },
      { name: "_feeRecipient", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      { name: "name_", type: "string" },
      { name: "symbol_", type: "string" },
      { name: "initialSupply_", type: "uint256" },
      { name: "antiBot_", type: "bool" },
      { name: "antiWhale_", type: "bool" },
      { name: "airdropMode_", type: "bool" },
      { name: "maxTxAmount_", type: "uint256" },
      { name: "taxRecipients_", type: "address[]" },
      { name: "taxPercentages_", type: "uint256[]" }
    ],
    name: "createToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "creationFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_fee", type: "uint256" }],
    name: "setCreationFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_recipient", type: "address" }],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export const TOKEN_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxTxAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "antiWhaleEnabled",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "taxEnabled",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalTaxPercentage",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getTaxRecipient",
    outputs: [
      { name: "recipient", type: "address" },
      { name: "percentage", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTaxRecipientsCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isTaxExempt",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  }
] as const

export interface TokenFactory {
  address: Address
  abi: typeof TOKEN_FACTORY_ABI
}

export interface Token {
  address: `0x${string}`
  abi: typeof TOKEN_ABI
} 