// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Token.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenFactory
 * @dev Deploys new Token contracts for users and charges a fee per deployment.
 */
contract TokenFactory is ReentrancyGuard {
    address public owner;
    uint256 public creationFee;
    address public feeRecipient;

    event TokenCreated(address indexed creator, address token, string name, string symbol);
    event CreationFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 _creationFee, address _feeRecipient) {
        owner = msg.sender;
        creationFee = _creationFee;
        feeRecipient = _feeRecipient;
    }

    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
        emit CreationFeeUpdated(_fee);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        bool antiBot_,
        bool antiWhale_,
        uint256 maxTxAmount_,
        bool taxEnabled_,
        address[] memory taxRecipients_,
        uint256[] memory taxPercentages_
    ) external payable nonReentrant returns (address) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(taxRecipients_.length == taxPercentages_.length, "Mismatched tax arrays");

        // Send exact fee amount to recipient
        (bool sent, ) = feeRecipient.call{value: creationFee}("");
        require(sent, "Fee transfer failed");

        // Refund excess ETH if any
        if (msg.value > creationFee) {
            (bool refundSent, ) = msg.sender.call{value: msg.value - creationFee}("");
            require(refundSent, "Refund failed");
        }

        // Deploy the new Token contract, minting initial supply to the user
        Token token = new Token(
            msg.sender,
            name_,
            symbol_,
            initialSupply_,
            antiBot_,
            antiWhale_,
            maxTxAmount_,
            taxEnabled_,
            taxRecipients_,
            taxPercentages_
        );

        emit TokenCreated(msg.sender, address(token), name_, symbol_);
        return address(token);
    }
} 