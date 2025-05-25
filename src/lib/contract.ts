import { TokenFactory__factory } from "../../typechain-types/factories/contracts/TokenFactory__factory"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { parseEther } from "viem"
import { useToast } from "@/components/ui/use-toast"
import { getTokenFactoryAddress, getEtherscanApiUrl } from "./config"
import { AbiCoder } from "ethers"
import { waitForTransactionReceipt } from "viem/actions"
import { getPublicClient } from '@wagmi/core'
import { config as wagmiConfig } from '@/lib/wagmi'
import { getChainId } from './config'
import { TransactionReceipt, PublicClient } from 'viem'
import { ethers } from "ethers"
import { id, Interface } from "ethers"

interface TokenParams {
  name: string
  symbol: string
  initialSupply: string
  antiBot: boolean
  antiWhale: boolean
  maxTxAmount: string
  taxEnabled: boolean
  taxRecipients: `0x${string}`[]
  taxPercentages: bigint[]
}

interface VerificationParams {
  contractAddress: string
  contractName: string
  constructorArguments: string
}

interface CreateTokenResult {
  tokenAddress: string
  transactionHash: string
  verificationStatus: 'pending' | 'verified' | 'failed'
}

export function useCreateToken() {
  const { address } = useAccount()
  const { toast } = useToast()

  const { writeContractAsync, isPending } = useWriteContract()

  const { data: creationFee } = useReadContract({
    address: getTokenFactoryAddress(),
    abi: TokenFactory__factory.abi,
    functionName: "creationFee",
  })

  const createToken = async (
    params: TokenParams,
    onTransactionSent?: () => void
  ): Promise<CreateTokenResult | undefined> => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!creationFee) {
      toast({
        title: "Error",
        description: "Failed to fetch creation fee",
        variant: "destructive",
      })
      return
    }

    try {
      // Step 1: Deploy token contract
      const hash = await writeContractAsync({
        address: getTokenFactoryAddress(),
        abi: TokenFactory__factory.abi,
        functionName: "createToken",
        args: [
          params.name,
          params.symbol,
          BigInt(params.initialSupply),
          params.antiBot,
          params.antiWhale,
          BigInt(params.maxTxAmount),
          params.taxEnabled,
          params.taxRecipients,
          params.taxPercentages
        ],
        value: creationFee,
        gas: 8_000_000n, // Increased gas limit
      })

      if (!hash) {
        throw new Error("Transaction failed")
      }
      if (onTransactionSent) onTransactionSent()
      console.log('[TokenCreator] Transaction hash:', hash)

      // Wait for transaction receipt with more confirmations
      const publicClient = getPublicClient(wagmiConfig, { chainId: getChainId() })
      console.log('[TokenCreator] Waiting for transaction receipt...', { hash, publicClient })
      let timeoutId: NodeJS.Timeout | null = null
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('[TokenCreator] Timeout: waitForTransactionReceipt took too long (120s)')
          reject(new Error('Timeout waiting for transaction receipt'))
        }, 120000) // Increased timeout to 120s
      })
      const receiptPromise = waitForTransactionReceipt(publicClient as PublicClient, {
        hash,
        confirmations: 2, // Increased confirmations
      })
      const receipt = await Promise.race([receiptPromise, timeoutPromise]) as TransactionReceipt
      if (timeoutId) clearTimeout(timeoutId)

      // Debug: Log environment and config
      console.log('[TokenCreator][DEBUG] ENV:', {
        NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
        BSC_TESTNET_RPC_URL: process.env.BSC_TESTNET_RPC_URL,
        BSC_RPC_URL: process.env.BSC_RPC_URL,
        FACTORY_ADDRESS: getTokenFactoryAddress(),
        CHAIN_ID: getChainId(),
      })
      console.log('[TokenCreator][DEBUG] Connected wallet address:', address)
      console.log('[TokenCreator][DEBUG] Transaction hash:', hash)
      console.log('[TokenCreator][DEBUG] Public client:', publicClient)

      // Parse logs for TokenCreated event
      const logs = receipt.logs
      console.log('[TokenCreator][DEBUG] Receipt logs:', logs)
      logs.forEach((log, idx) => {
        console.log(`[TokenCreator][DEBUG] Log #${idx}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data,
        })
      })
      
      // Find the TokenCreated event log by checking all logs
      const TOKEN_CREATED_EVENT_SIG = 'TokenCreated(address,address,string,string)';
      const TOKEN_CREATED_EVENT_TOPIC = id(TOKEN_CREATED_EVENT_SIG);

      const tokenCreatedLog = logs.find(log => {
        if (log.address.toLowerCase() !== getTokenFactoryAddress().toLowerCase()) return false;
        return log.topics[0] === TOKEN_CREATED_EVENT_TOPIC;
      });

      if (!tokenCreatedLog) {
        console.error('[TokenCreator][ERROR] TokenCreated event not found in logs')
        throw new Error("TokenCreated event not found in logs")
      }

      const abi = [
        "event TokenCreated(address indexed creator, address token, string name, string symbol)"
      ];
      const iface = new Interface(abi);
      const parsedLog = iface.parseLog(tokenCreatedLog);
      if (!parsedLog) {
        throw new Error("Failed to parse TokenCreated event log");
      }
      const tokenAddress = parsedLog.args.token;

      if (!tokenAddress) {
        throw new Error("Token address not found in logs")
      }

      return {
        tokenAddress,
        transactionHash: hash,
        verificationStatus: 'pending',
      }
    } catch (error) {
      console.error('[TokenCreator] Error in createToken:', error)
      const msg = (error instanceof Error && error.message) ? error.message.toLowerCase() : ''
      if (
        msg.includes('user rejected the request') ||
        msg.includes('contractfunctionexecutionerror: user rejected') ||
        msg.includes('user rejected') ||
        msg.includes('denied transaction') ||
        msg.includes('user denied') ||
        msg.includes('user closed') ||
        msg.includes('cancelled')
      ) {
        throw new Error('USER_REJECTED')
      }
      console.error("Token creation error:", error)
      throw error
    }
  }

  return {
    createToken,
    isLoading: isPending,
    isSuccess: true,
    creationFee: creationFee ? creationFee.toString() : "0",
  }
}

export function encodeConstructorArguments(
  name: string,
  symbol: string,
  initialSupply: bigint,
  antiBot: boolean,
  antiWhale: boolean,
  maxTxAmount: bigint,
  taxEnabled: boolean,
  taxRecipients: string[],
  taxPercentages: bigint[]
): string {
  const abiCoder = new AbiCoder()
  return abiCoder.encode(
    [
      "string",
      "string",
      "uint256",
      "bool",
      "bool",
      "uint256",
      "bool",
      "address[]",
      "uint256[]"
    ],
    [
      name,
      symbol,
      initialSupply,
      antiBot,
      antiWhale,
      maxTxAmount,
      taxEnabled,
      taxRecipients,
      taxPercentages
    ]
  )
}

export async function verifyContract(params: VerificationParams) {
  const { contractAddress, contractName, constructorArguments } = params
  
  if (!process.env.ETHERSCAN_API_KEY) {
    return { 
      success: false, 
      message: 'Etherscan API key not configured',
      status: '0'
    }
  }

  try {
    // First, check if contract is already verified
    const checkResponse = await fetch(
      `${getEtherscanApiUrl()}?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`,
      { method: 'GET' }
    )
    const checkData = await checkResponse.json()
    
    if (checkData.status === '1' && checkData.result !== 'Contract source code not verified') {
      return { 
        success: true, 
        message: 'Contract already verified',
        status: '1'
      }
    }

    // If not verified, proceed with verification
    const response = await fetch(getEtherscanApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: process.env.ETHERSCAN_API_KEY,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        contractname: contractName,
        compilerversion: 'v0.8.20+commit.a1b79de6',
        optimizationUsed: '1',
        runs: '200',
        constructorArguments: constructorArguments,
        codeformat: 'solidity-single-file',
        licenseType: '1', // MIT License
        evmVersion: 'london',
        chainId: getChainId().toString(),
        sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/ERC20.sol)
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/extensions/IERC20Metadata.sol)
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

// OpenZeppelin Contracts (last updated v4.9.0) (utils/Context.sol)
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/ERC20.sol)
contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        _beforeTokenTransfer(from, to, amount);
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
        _afterTokenTransfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");
        _beforeTokenTransfer(address(0), account, amount);
        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
        _afterTokenTransfer(address(0), account, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}

// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)
abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// Token Contract
contract ${contractName} is ERC20, Ownable {
    bool public antiBotEnabled;
    bool public antiWhaleEnabled;
    bool public airdropModeEnabled;
    uint256 public maxTxAmount;
    mapping(address => bool) public isBlacklisted;

    struct TaxRecipient {
        address recipient;
        uint256 percentage;
    }
    
    TaxRecipient[] public taxRecipients;
    uint256 public totalTaxPercentage;
    bool public taxEnabled;
    mapping(address => bool) public isTaxExempt;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        bool antiBot_,
        bool antiWhale_,
        bool airdropMode_,
        uint256 maxTxAmount_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply_);
        antiBotEnabled = antiBot_;
        antiWhaleEnabled = antiWhale_;
        airdropModeEnabled = airdropMode_;
        maxTxAmount = maxTxAmount_;
        taxEnabled = false;
        totalTaxPercentage = 0;
    }

    function setBlacklist(address user, bool value) external onlyOwner {
        isBlacklisted[user] = value;
    }

    function setAntiBotEnabled(bool value) external onlyOwner {
        antiBotEnabled = value;
    }

    function setAntiWhaleEnabled(bool value) external onlyOwner {
        antiWhaleEnabled = value;
    }

    function setAirdropModeEnabled(bool value) external onlyOwner {
        airdropModeEnabled = value;
    }

    function setMaxTxAmount(uint256 value) external onlyOwner {
        maxTxAmount = value;
    }

    function setTaxExempt(address account, bool exempt) external onlyOwner {
        isTaxExempt[account] = exempt;
    }

    function setTaxEnabled(bool enabled) external onlyOwner {
        taxEnabled = enabled;
    }

    function addTaxRecipient(address recipient, uint256 percentage) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");
        require(percentage > 0, "Percentage must be greater than 0");
        require(totalTaxPercentage + percentage <= 100, "Total tax cannot exceed 100%");
        
        taxRecipients.push(TaxRecipient(recipient, percentage));
        totalTaxPercentage += percentage;
    }

    function removeTaxRecipient(uint256 index) external onlyOwner {
        require(index < taxRecipients.length, "Invalid index");
        totalTaxPercentage -= taxRecipients[index].percentage;
        
        if (index < taxRecipients.length - 1) {
            taxRecipients[index] = taxRecipients[taxRecipients.length - 1];
        }
        taxRecipients.pop();
    }

    function getTaxRecipientsCount() external view returns (uint256) {
        return taxRecipients.length;
    }

    function getTaxRecipient(uint256 index) external view returns (address, uint256) {
        require(index < taxRecipients.length, "Invalid index");
        return (taxRecipients[index].recipient, taxRecipients[index].percentage);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _validateTransfer(msg.sender, to, amount);
        if (taxEnabled && !isTaxExempt[msg.sender]) {
            uint256 taxAmount = (amount * totalTaxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            _transfer(msg.sender, to, transferAmount);
            _distributeTax(msg.sender, taxAmount);
        } else {
            _transfer(msg.sender, to, amount);
        }
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _validateTransfer(from, to, amount);
        if (taxEnabled && !isTaxExempt[from]) {
            uint256 taxAmount = (amount * totalTaxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            _transfer(from, to, transferAmount);
            _distributeTax(from, taxAmount);
        } else {
            _transfer(from, to, amount);
        }
        return true;
    }

    function _distributeTax(address from, uint256 taxAmount) internal {
        for (uint256 i = 0; i < taxRecipients.length; i++) {
            uint256 recipientAmount = (taxAmount * taxRecipients[i].percentage) / totalTaxPercentage;
            _transfer(from, taxRecipients[i].recipient, recipientAmount);
        }
    }

    function _validateTransfer(address from, address to, uint256 amount) internal view {
        if (antiBotEnabled) {
            require(!isBlacklisted[from] && !isBlacklisted[to], "Blacklisted");
        }
        if (antiWhaleEnabled && from != owner() && to != owner()) {
            require(amount <= maxTxAmount, "Exceeds max tx amount");
        }
    }
}`,
      }),
    })

    const data = await response.json()
    console.log('Etherscan verification POST response:', data)
    
    if (data.status === '1') {
      // If verification is successful, wait for Etherscan to process it
      let isVerified = false
      let attempts = 0
      const maxAttempts = 10
      const guid = data.result
      
      while (!isVerified && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds between checks
        
        // Check verification status using the proper endpoint
        const statusResponse = await fetch(
          `${getEtherscanApiUrl()}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${process.env.ETHERSCAN_API_KEY}`,
          { method: 'GET' }
        )
        const statusData = await statusResponse.json()
        
        if (statusData.status === '1') {
          if (statusData.result.includes('Pass')) {
            isVerified = true
            return { 
              success: true, 
              message: 'Contract verified successfully',
              status: '1'
            }
          } else if (statusData.result.includes('Fail')) {
            return { 
              success: false, 
              message: `Verification failed: ${statusData.result}`,
              status: '0'
            }
          }
        }
        
        attempts++
      }
      
      if (!isVerified) {
        return { 
          success: false, 
          message: 'Verification timed out',
          status: '0'
        }
      }
    } else {
      return { 
        success: false, 
        message: data.result || 'Verification failed',
        status: '0'
      }
    }
  } catch (error) {
    console.error('Verification error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: '0'
    }
  }
} 