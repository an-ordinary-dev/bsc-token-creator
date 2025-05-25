# BSC Token Creator

**This is a premium source code sold by [Byteory](https://byteory.com), a web3 development agency.**

For more source code, visit [byteory.com/source-code](https://byteory.com/source-code).
For customization and support, contact [@byteory on Telegram](https://t.me/byteory), email [support@byteory.com](mailto:support@byteory.com), or WhatsApp [wa.me/+918879732362](https://wa.me/+918879732362).

---

## Table of Contents
- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Deployment](#deployment)
- [Verification](#verification)
- [Usage](#usage)
- [Running on Mainnet](#running-on-mainnet)
- [Support](#support)
- [License](#license)

---

## About
This source code allows you to create and deploy BEP20 tokens with advanced features on Binance Smart Chain (BSC). It is designed for launching your own token with professional-grade security features.

## Features
- 🛡️ Anti-bot protection
- 🐋 Anti-whale measures
- 💰 Tax system with multiple recipients
- 🎁 Airdrop mode
- 🔒 Secure and audited smart contracts
- 🎨 Modern and responsive UI
- 📱 Mobile-friendly design

## Prerequisites
Before you begin, ensure you have:

### 1. Development Tools
- **Git**: Version control system ([Download](https://git-scm.com/downloads))
  - Verify: `git --version`
- **Node.js**: v18 or later ([Download](https://nodejs.org))
  - Verify: `node --version`
- **Yarn**: Package manager ([Install](https://classic.yarnpkg.com/lang/en/docs/install/))
  - Verify: `yarn --version`
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com))
  - Recommended extensions: Solidity, ESLint, Prettier, GitLens

### 2. Web3 Knowledge
- Basic understanding of Binance Smart Chain and smart contracts
- BEP20 token standard
- Wallet management (MetaMask recommended)
- Gas fees and transactions (BNB)

### 3. Accounts & API Keys
- MetaMask wallet (or any Web3 wallet)
- BSC RPC provider (e.g., Ankr, QuickNode, Chainstack)
- BscScan account (for contract verification)

---

## Installation

### 1. Install Dependencies
```bash
yarn install
```

### 2. Environment Setup
Create a `.env` file in the root directory with the following variables:
```env
# Network selection
NEXT_PUBLIC_NETWORK=bscTestnet  # or bsc for mainnet

# RPC URLs
BSC_TESTNET_RPC_URL=your_bsc_testnet_rpc_url
BSC_RPC_URL=your_bsc_mainnet_rpc_url

# Token Factory
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=your_token_factory_address
NEXT_PUBLIC_CREATION_FEE=0.01
NEXT_PUBLIC_FEE_RECIPIENT=your_fee_recipient_address

# BscScan
BSCSCAN_API_KEY=your_bscscan_api_key

# Wallet
PRIVATE_KEY=your_private_key
```

### 3. Get Required API Keys
- **BSC RPC URL**: (e.g., Ankr, QuickNode, Chainstack)
- **BscScan API Key**: [bscscan.com](https://bscscan.com) → Create account → API Keys section → New API key

---

## Deployment

### 1. Compile Contracts
```bash
yarn hardhat compile
```

### 2. Deploy to BSC Testnet for testing
```bash
yarn hardhat run scripts/deploy.ts --network bsc
```
After successful deployment, you will see:
- TokenFactory contract address
- Creation fee
- Fee recipient address

## Verification
Verify your contract on BscScan:
```bash
yarn hardhat run scripts/verify.ts --network bsc
```

## Contract Verification & Testing

After verifying your contract, you can run the test-verification script to simulate token creation and contract verification:

```sh
yarn ts-node scripts/test-verification.ts
```

This script will deploy a test token, wait, and attempt BscScan verification automatically.

### 3. Deploy to Mainnet

Before deploying to mainnet, ensure you have:
1. Sufficient BNB in your wallet for deployment
2. Updated `.env` file with mainnet configuration
3. Tested thoroughly on testnet

To deploy to mainnet:
```bash
# 1. Update .env file with mainnet configuration
NEXT_PUBLIC_NETWORK=bsc
BSC_RPC_URL=your_bsc_mainnet_rpc_url
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=your_mainnet_token_factory_address
BSCSCAN_API_KEY=your_mainnet_bscscan_api_key

# 2. Deploy TokenFactory to mainnet
yarn hardhat run scripts/deploy.ts --network bsc

# 3. Verify the contract on BscScan
yarn hardhat run scripts/verify.ts --network bsc
```

---

## Usage

### 1. Start Development Server
```bash
yarn dev
```

### 2. Create a Token
1. Connect your wallet
2. Fill in token details: Name, Symbol, Total Supply
3. Configure features: Anti-bot protection, Anti-whale measures, Tax system
4. Pay the creation fee (in BNB)
5. Deploy your token

### 3. Verify Your Token
After deployment once you run yarn ts-node scripts/test-verification.ts it will automatically verify all the other or future tokens which will be created.
---

## Support
For help or customization, contact:
- Telegram: [@byteory](https://t.me/byteory)
- Email: [support@byteory.com](mailto:support@byteory.com)
- WhatsApp: [+91 8879732362](https://wa.me/+918879732362)
- Website: [byteory.com](https://byteory.com)

---

## License
This source code is sold under a commercial license. You are not allowed to resell, redistribute, or share this code. It is for the buyer's use only. For more details or to purchase additional licenses, contact Byteory.

Copyright 2025 Byteory. All rights reserved.