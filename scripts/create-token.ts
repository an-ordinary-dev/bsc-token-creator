import { ethers } from "hardhat"
import * as dotenv from "dotenv"
import { Signer } from "ethers"
dotenv.config()

async function main() {
  const [signer] = await ethers.getSigners()

  const tokenFactoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS!
  const creationFee = ethers.parseEther(process.env.NEXT_PUBLIC_CREATION_FEE || "0.01")

  const TokenFactory = await ethers.getContractAt("TokenFactory", tokenFactoryAddress, signer as unknown as Signer)

  // Example parameters (adjust as needed)
  const name = "TestToken"
  const symbol = "TTK"
  const initialSupply = ethers.parseEther("1000000") // 1,000,000 tokens (18 decimals)
  const antiBot = false
  const antiWhale = false
  const maxTxAmount = ethers.parseEther("1000000")
  const taxEnabled = false
  const taxRecipients: string[] = []
  const taxPercentages: number[] = []

  // Test 1: No tax
  try {
    console.log("Testing token creation with NO tax...")
    const tx = await TokenFactory.createToken(
      name,
      symbol,
      initialSupply,
      antiBot,
      antiWhale,
      maxTxAmount,
      taxEnabled,
      taxRecipients,
      taxPercentages,
      { value: creationFee }
    )
    const receipt = await tx.wait()
    console.log("[NO TAX] Token creation tx hash:", tx.hash)
    console.log("[NO TAX] Receipt:", receipt)
  } catch (error: any) {
    console.error("[NO TAX] Revert reason:", error?.reason || error?.message || error)
  }

  // Test 2: With tax
  try {
    console.log("Testing token creation WITH tax...")
    const tx = await TokenFactory.createToken(
      name,
      symbol,
      initialSupply,
      antiBot,
      antiWhale,
      maxTxAmount,
      true, // taxEnabled
      [
        "0xC3F34D63FB2F977982C4AE0B1E7D81D1DA5D06A1",
        "0xD6601A00DD6C3F9E4F002DE572C9AC6DA57B933F"
      ],
      [2, 4], // taxPercentages
      { value: creationFee }
    )
    const receipt = await tx.wait()
    console.log("[WITH TAX] Token creation tx hash:", tx.hash)
    console.log("[WITH TAX] Receipt:", receipt)
  } catch (error: any) {
    console.error("[WITH TAX] Revert reason:", error?.reason || error?.message || error)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})