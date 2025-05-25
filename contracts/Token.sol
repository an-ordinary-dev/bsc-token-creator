// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Token
 * @dev ERC20 Token with immutable anti-bot, anti-whale, and tax functionality set at deployment.
 */
contract Token is ERC20, ReentrancyGuard {
    // Anti-bot/anti-whale state variables (immutable after deployment)
    bool public immutable antiBotEnabled;
    bool public immutable antiWhaleEnabled;
    uint256 public immutable maxTxAmount;

    // Tax related state variables (immutable after deployment)
    struct TaxRecipient {
        address recipient;
        uint256 percentage;
        bool isContract;
    }
    TaxRecipient[] public taxRecipients;
    uint256 public immutable totalTaxPercentage;
    bool public immutable taxEnabled;
    uint256 public constant MAX_TAX_RECIPIENTS = 10;
    
    // Tax exemption addresses (immutable after deployment)
    address public immutable creator;
    mapping(address => bool) public isTaxExempt;
    mapping(address => bool) public isWhaleExempt;

    // Events
    event TransferWithTax(address indexed from, address indexed to, uint256 amount, uint256 taxAmount);

    constructor(
        address creator_,
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        bool antiBot_,
        bool antiWhale_,
        uint256 maxTxAmount_,
        bool taxEnabled_,
        address[] memory taxRecipients_,
        uint256[] memory taxPercentages_
    ) ERC20(name_, symbol_) {
        require(taxRecipients_.length == taxPercentages_.length, "Mismatched tax arrays");
        require(taxRecipients_.length <= MAX_TAX_RECIPIENTS, "Too many tax recipients");
        uint256 _totalTax = 0;
        
        // Store creator address
        creator = creator_;
        isTaxExempt[creator_] = true;
        isWhaleExempt[creator_] = true; // Exempt creator
        isWhaleExempt[address(this)] = true; // Exempt contract itself
        
        for (uint256 i = 0; i < taxRecipients_.length; i++) {
            require(taxRecipients_[i] != address(0), "Invalid recipient address");
            require(taxPercentages_[i] > 0, "Percentage must be greater than 0");
            _totalTax += taxPercentages_[i];
            address recipient = taxRecipients_[i];
            uint32 size;
            assembly {
                size := extcodesize(recipient)
            }
            bool isContract = size > 0;
            taxRecipients.push(TaxRecipient(recipient, taxPercentages_[i], isContract));
            
            // Add tax recipient to exempt addresses
            isTaxExempt[recipient] = true;
            isWhaleExempt[recipient] = true; // Exempt tax recipients
        }
        
        require(_totalTax <= 100, "Total tax cannot exceed 100%");
        totalTaxPercentage = _totalTax;
        taxEnabled = taxEnabled_ && taxRecipients_.length > 0 && _totalTax > 0;
        antiBotEnabled = antiBot_;
        antiWhaleEnabled = antiWhale_;
        maxTxAmount = maxTxAmount_;
        _mint(creator_, initialSupply_);
    }

    // Internal function to check if address is tax exempt
    function _isTaxExempt(address account) internal view returns (bool) {
        if (account == creator) return true;
        return isTaxExempt[account];
    }

    // Override transfer functions to add tax logic
    function transfer(address to, uint256 amount) public override returns (bool) {
        _validateTransfer(msg.sender, to, amount);
        if (taxEnabled && !_isTaxExempt(msg.sender)) {
            uint256 taxAmount = (amount * totalTaxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            _transfer(msg.sender, to, transferAmount);
            _distributeTax(msg.sender, taxAmount);
            emit TransferWithTax(msg.sender, to, transferAmount, taxAmount);
        } else {
            _transfer(msg.sender, to, amount);
        }
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _validateTransfer(from, to, amount);
        _spendAllowance(from, msg.sender, amount);
        if (taxEnabled && !_isTaxExempt(from)) {
            uint256 taxAmount = (amount * totalTaxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            _transfer(from, to, transferAmount);
            _distributeTax(from, taxAmount);
            emit TransferWithTax(from, to, transferAmount, taxAmount);
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

    // Internal validation function
    function _validateTransfer(address from, address to, uint256 amount) internal view {
        if (antiBotEnabled) {
            // No blacklist logic, just a placeholder for future anti-bot extensions
            require(from != address(0) && to != address(0), "Invalid address");
        }
        if (antiWhaleEnabled && !isWhaleExempt[from] && !isWhaleExempt[to]) {
            require(amount <= maxTxAmount, "Exceeds max tx amount");
        }
    }

    // View functions for tax recipients
    function getTaxRecipientsCount() external view returns (uint256) {
        return taxRecipients.length;
    }

    function getTaxRecipient(uint256 index) external view returns (address, uint256, bool) {
        require(index < taxRecipients.length, "Invalid index");
        return (taxRecipients[index].recipient, taxRecipients[index].percentage, taxRecipients[index].isContract);
    }
} 