import { ethers } from "hardhat"
import * as dotenv from "dotenv"
import * as hre from "hardhat"
dotenv.config()

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)

  const creationFee = ethers.parseEther(process.env.NEXT_PUBLIC_CREATION_FEE || "0.01")
  const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT || deployer.address

  // NOTE: The TokenFactory constructor arguments must match the contract. No changes needed unless TokenFactory constructor changes.
  const TokenFactory = await ethers.getContractFactory("TokenFactory")
  const tokenFactory = await TokenFactory.deploy(creationFee, feeRecipient)

  await tokenFactory.waitForDeployment()

  console.log("TokenFactory deployed to:", await tokenFactory.getAddress())
  console.log("Creation fee:", ethers.formatEther(creationFee), "BNB")
  console.log("Fee recipient:", feeRecipient)

  // Verify the contract if we're on a supported network
  if (process.env.NEXT_PUBLIC_VERIFY_CONTRACT === "true") {
    console.log("Verifying contract...")
    try {
      await hre.run("verify:verify", {
        address: await tokenFactory.getAddress(),
        constructorArguments: [creationFee, feeRecipient],
      })
      console.log("Contract verified successfully!")
    } catch (error) {
      console.error("Verification failed:", error)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })