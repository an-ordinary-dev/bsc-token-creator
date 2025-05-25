import { NextRequest } from 'next/server'
import { getEtherscanApiUrl } from '@/lib/config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { contractAddress, contractName, constructorArguments } = body

  if (!process.env.BSCSCAN_API_KEY) {
    return Response.json({ 
      status: '0', 
      message: 'BscScan API key not configured' 
    }, { status: 500 })
  }

  try {
    // First, check if contract is already verified
    const checkResponse = await fetch(
      `${getEtherscanApiUrl()}?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BSCSCAN_API_KEY}`,
      { method: 'GET' }
    )
    const checkData = await checkResponse.json()
    
    if (checkData.status === '1' && checkData.result !== 'Contract source code not verified') {
      return Response.json({ status: '1', message: 'Contract already verified' })
    }

    // If not verified, proceed with verification
    const response = await fetch(getEtherscanApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: process.env.BSCSCAN_API_KEY,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        contractname: contractName,
        compilerversion: 'v0.8.20+commit.a1b79de6',
        optimizationUsed: '1',
        runs: '200',
        constructorArguments: constructorArguments,
        sourceCode: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\n\ncontract ${contractName} is ERC20, Ownable {\n    bool public antiBotEnabled;\n    bool public antiWhaleEnabled;\n    bool public airdropModeEnabled;\n    uint256 public maxTxAmount;\n    mapping(address => bool) public isBlacklisted;\n\n    struct TaxRecipient {\n        address recipient;\n        uint256 percentage;\n    }\n    \n    TaxRecipient[] public taxRecipients;\n    uint256 public totalTaxPercentage;\n    bool public taxEnabled;\n    mapping(address => bool) public isTaxExempt;\n\n    constructor(\n        string memory name_,\n        string memory symbol_,\n        uint256 initialSupply_,\n        bool antiBot_,\n        bool antiWhale_,\n        bool airdropMode_,\n        uint256 maxTxAmount_,\n        address initialOwner\n    ) ERC20(name_, symbol_) Ownable(initialOwner) {\n        _mint(initialOwner, initialSupply_);\n        antiBotEnabled = antiBot_;\n        antiWhaleEnabled = antiWhale_;\n        airdropModeEnabled = airdropMode_;\n        maxTxAmount = maxTxAmount_;\n        taxEnabled = false;\n        totalTaxPercentage = 0;\n    }\n\n    function setBlacklist(address user, bool value) external onlyOwner {\n        isBlacklisted[user] = value;\n    }\n\n    function setAntiBotEnabled(bool value) external onlyOwner {\n        antiBotEnabled = value;\n    }\n\n    function setAntiWhaleEnabled(bool value) external onlyOwner {\n        antiWhaleEnabled = value;\n    }\n\n    function setAirdropModeEnabled(bool value) external onlyOwner {\n        airdropModeEnabled = value;\n    }\n\n    function setMaxTxAmount(uint256 value) external onlyOwner {\n        maxTxAmount = value;\n    }\n\n    function setTaxExempt(address account, bool exempt) external onlyOwner {\n        isTaxExempt[account] = exempt;\n    }\n\n    function setTaxEnabled(bool enabled) external onlyOwner {\n        taxEnabled = enabled;\n    }\n\n    function addTaxRecipient(address recipient, uint256 percentage) external onlyOwner {\n        require(recipient != address(0), \"Invalid recipient address\");\n        require(percentage > 0, \"Percentage must be greater than 0\");\n        require(totalTaxPercentage + percentage <= 100, \"Total tax cannot exceed 100%\");\n        \n        taxRecipients.push(TaxRecipient(recipient, percentage));\n        totalTaxPercentage += percentage;\n    }\n\n    function removeTaxRecipient(uint256 index) external onlyOwner {\n        require(index < taxRecipients.length, \"Invalid index\");\n        totalTaxPercentage -= taxRecipients[index].percentage;\n        \n        if (index < taxRecipients.length - 1) {\n            taxRecipients[index] = taxRecipients[taxRecipients.length - 1];\n        }\n        taxRecipients.pop();\n    }\n\n    function getTaxRecipientsCount() external view returns (uint256) {\n        return taxRecipients.length;\n    }\n\n    function getTaxRecipient(uint256 index) external view returns (address, uint256) {\n        require(index < taxRecipients.length, \"Invalid index\");\n        return (taxRecipients[index].recipient, taxRecipients[index].percentage);\n    }\n\n    function transfer(address to, uint256 amount) public override returns (bool) {\n        _validateTransfer(msg.sender, to, amount);\n        if (taxEnabled && !isTaxExempt[msg.sender]) {\n            uint256 taxAmount = (amount * totalTaxPercentage) / 100;\n            uint256 transferAmount = amount - taxAmount;\n            _transfer(msg.sender, to, transferAmount);\n            _distributeTax(msg.sender, taxAmount);\n        } else {\n            _transfer(msg.sender, to, amount);\n        }\n        return true;\n    }\n\n    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {\n        _validateTransfer(from, to, amount);\n        if (taxEnabled && !isTaxExempt[from]) {\n            uint256 taxAmount = (amount * totalTaxPercentage) / 100;\n            uint256 transferAmount = amount - taxAmount;\n            _transfer(from, to, transferAmount);\n            _distributeTax(from, taxAmount);\n        } else {\n            _transfer(from, to, amount);\n        }\n        return true;\n    }\n\n    function _distributeTax(address from, uint256 taxAmount) internal {\n        for (uint256 i = 0; i < taxRecipients.length; i++) {\n            uint256 recipientAmount = (taxAmount * taxRecipients[i].percentage) / totalTaxPercentage;\n            _transfer(from, taxRecipients[i].recipient, recipientAmount);\n        }\n    }\n\n    function _validateTransfer(address from, address to, uint256 amount) internal view {\n        if (antiBotEnabled) {\n            require(!isBlacklisted[from] && !isBlacklisted[to], \"Blacklisted\");\n        }\n        if (antiWhaleEnabled && from != owner() && to != owner()) {\n            require(amount <= maxTxAmount, \"Exceeds max tx amount\");\n        }\n    }\n}`,
      }),
    })

    const data = await response.json()
    console.log('BscScan verification POST response:', data)
    
    if (data.status === '1') {
      // If verification is successful, wait for BscScan to process it
      let isVerified = false
      let attempts = 0
      const maxAttempts = 10
      
      while (!isVerified && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds between checks
        
        const checkVerifiedResponse = await fetch(
          `${getEtherscanApiUrl()}?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BSCSCAN_API_KEY}`,
          { method: 'GET' }
        )
        const checkVerifiedData = await checkVerifiedResponse.json()
        console.log('BscScan verification status poll:', checkVerifiedData)
        
        if (checkVerifiedData.status === '1' && checkVerifiedData.result !== 'Contract source code not verified') {
          isVerified = true
        }
        
        attempts++
      }
      
      return Response.json({ 
        status: isVerified ? '1' : '0',
        message: isVerified ? 'Contract verified successfully' : 'Verification pending'
      })
    }
    
    return Response.json({ 
      status: '0', 
      message: data.message || 'Verification failed',
      details: data.result || 'No additional details available'
    })
  } catch (error) {
    console.error('Verification error:', error)
    return Response.json({ 
      status: '0', 
      message: 'Verification failed due to an error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 