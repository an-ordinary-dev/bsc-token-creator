import { ethers } from "hardhat"
import * as hre from "hardhat"
import * as dotenv from "dotenv"

dotenv.config()

async function main() {
  const tokenFactoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS
  if (!tokenFactoryAddress) {
    throw new Error("TokenFactory address not found in environment variables")
  }

  const creationFee = ethers.parseEther(process.env.NEXT_PUBLIC_CREATION_FEE || "0.01")
  const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT
  if (!feeRecipient) {
    throw new Error("Fee recipient address not found in environment variables")
  }

  console.log("Verifying TokenFactory contract...")
  console.log("Address:", tokenFactoryAddress)
  console.log("Creation Fee:", ethers.formatEther(creationFee), "BNB")
  console.log("Fee Recipient:", feeRecipient)
  
  // NOTE: The TokenFactory constructor arguments must match the contract. No changes needed unless TokenFactory constructor changes.
  await hre.run("verify:verify", {
    address: tokenFactoryAddress,
    constructorArguments: [creationFee, feeRecipient],
    force: true
  })

  console.log("TokenFactory verified successfully!")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}) 