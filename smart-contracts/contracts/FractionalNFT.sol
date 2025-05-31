// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FractionalNFT
 * @dev ERC20 token representing fractional ownership of a specific NFT
 */
contract FractionalNFT is ERC20, Ownable, ReentrancyGuard {
    address public nftCollection;
    uint256 public nftTokenId;
    uint256 public sharePrice;
    string public nftMetadataURI;
    uint256 public creationTime;
    address public creator; // Original creator of the NFT
    
    // Share tracking
    mapping(address => uint256) public userShares;
    address[] public shareHolders;
    uint256 public totalSharesAmount; // Total shares as regular number (not with decimals)
    
    event SharesPurchased(address indexed buyer, uint256 amount, uint256 totalPaid);
    event SharesTransferred(address indexed from, address indexed to, uint256 amount);
    event SharePriceUpdated(uint256 newPrice);
    event OwnershipChanged(address indexed newOwner, uint256 percentage);
    event NFTTransferred(address indexed newOwner);

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalShares,
        uint256 _sharePrice,
        address _nftCollection,
        uint256 _nftTokenId,
        string memory _nftMetadataURI,
        address initialOwner
    ) ERC20(name, symbol) {
        nftCollection = _nftCollection;
        nftTokenId = _nftTokenId;
        sharePrice = _sharePrice;
        nftMetadataURI = _nftMetadataURI;
        creationTime = block.timestamp;
        creator = initialOwner; // Store the original creator
        totalSharesAmount = totalShares;
        
        // Mint all tokens to the creator initially
        _mint(initialOwner, totalShares * 10**decimals());
        _transferOwnership(initialOwner);
        
        // Creator holds all shares initially
        userShares[initialOwner] = totalShares;
        shareHolders.push(initialOwner);
    }

    function setSharePrice(uint256 _sharePrice) external onlyOwner {
        sharePrice = _sharePrice;
        emit SharePriceUpdated(_sharePrice);
    }

    /**
     * @dev Buy shares from available holders. If buying all shares, automatically transfers NFT ownership.
     * @param shareAmount Number of shares to buy
     */
    function buyShares(uint256 shareAmount) external payable nonReentrant {
        require(sharePrice > 0, "Share price not set");
        require(shareAmount > 0, "Share amount must be greater than 0");
        require(msg.value == sharePrice * shareAmount, "Incorrect ETH amount");

        uint256 tokenAmount = shareAmount * 10**decimals();
        
        // Check if buying all available shares
        bool buyingAllShares = (shareAmount == totalSharesAmount);
        
        // If buying all shares, the current owner should have all shares
        if (buyingAllShares) {
            address currentNFTOwner = owner();
            require(userShares[currentNFTOwner] == totalSharesAmount, "Owner doesn't have all shares");
            require(balanceOf(currentNFTOwner) >= tokenAmount, "Owner has insufficient shares");
            
            // Transfer all shares to buyer
            super._transfer(currentNFTOwner, msg.sender, tokenAmount);
            _updateShareHolding(currentNFTOwner, msg.sender, shareAmount);
            
            // Transfer NFT ownership
            _transferNFTOwnership(msg.sender);
            
            // Pay the previous owner
            payable(currentNFTOwner).transfer(msg.value);
        } else {
            // Regular share purchase - find available shares
            uint256 remainingAmount = shareAmount;
            uint256 totalPaid = 0;
            
            // Try to buy from multiple holders if needed
            for (uint i = 0; i < shareHolders.length && remainingAmount > 0; i++) {
                address seller = shareHolders[i];
                if (seller != msg.sender && userShares[seller] > 0) {
                    uint256 availableFromSeller = userShares[seller];
                    uint256 toBuyFromSeller = remainingAmount <= availableFromSeller ? remainingAmount : availableFromSeller;
                    
                    if (toBuyFromSeller > 0) {
                        uint256 tokenAmountFromSeller = toBuyFromSeller * 10**decimals();
                        uint256 paymentToSeller = sharePrice * toBuyFromSeller;
                        
                        // Transfer shares
                        super._transfer(seller, msg.sender, tokenAmountFromSeller);
                        _updateShareHolding(seller, msg.sender, toBuyFromSeller);
                        
                        // Pay seller
                        payable(seller).transfer(paymentToSeller);
                        
                        remainingAmount -= toBuyFromSeller;
                        totalPaid += paymentToSeller;
                    }
                }
            }
            
            require(remainingAmount == 0, "Not enough shares available");
        }

        emit SharesPurchased(msg.sender, shareAmount, msg.value);
        _checkOwnershipChange();
    }

    /**
     * @dev Transfer shares between users
     */
    function transferShares(address to, uint256 shareAmount) external {
        require(shareAmount > 0, "Share amount must be greater than 0");
        require(userShares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 tokenAmount = shareAmount * 10**decimals();
        super._transfer(msg.sender, to, tokenAmount);

        _updateShareHolding(msg.sender, to, shareAmount);

        emit SharesTransferred(msg.sender, to, shareAmount);
        _checkOwnershipChange();
    }

    /**
     * @dev Update share holdings and manage shareholders array
     */
    function _updateShareHolding(address from, address to, uint256 shareAmount) internal {
        userShares[from] -= shareAmount;
        
        if (userShares[to] == 0) {
            shareHolders.push(to);
        }
        userShares[to] += shareAmount;

        if (userShares[from] == 0) {
            _removeShareHolder(from);
        }
    }

    /**
     * @dev Remove a shareholder from the array
     */
    function _removeShareHolder(address holder) internal {
        for (uint i = 0; i < shareHolders.length; i++) {
            if (shareHolders[i] == holder) {
                shareHolders[i] = shareHolders[shareHolders.length - 1];
                shareHolders.pop();
                break;
            }
        }
    }

    /**
     * @dev Check and handle ownership changes based on share distribution
     */
    function _checkOwnershipChange() internal {
        address currentOwner = owner();
        
        for (uint i = 0; i < shareHolders.length; i++) {
            address holder = shareHolders[i];
            if (holder != currentOwner) {
                uint256 holderShares = userShares[holder];
                
                // Transfer ownership if someone owns ALL shares (100%)
                if (holderShares == totalSharesAmount) {
                    _transferNFTOwnership(holder);
                    break;
                }
            }
        }
    }

    /**
     * @dev Transfer NFT ownership and contract ownership
     */
    function _transferNFTOwnership(address newOwner) internal {
        address previousOwner = owner(); // Store current owner before changing it
        
        // Transfer contract ownership
        _transferOwnership(newOwner);
        
        // Transfer the actual NFT if this contract is approved or owns it
        try IERC721(nftCollection).transferFrom(previousOwner, newOwner, nftTokenId) {
            emit NFTTransferred(newOwner);
        } catch {
            // If transfer fails, just emit ownership change event
            emit OwnershipChanged(newOwner, 100);
        }
    }

    // View functions
    function getShareHolders() external view returns (address[] memory holders, uint256[] memory shares, uint256[] memory percentages) {
        holders = new address[](shareHolders.length);
        shares = new uint256[](shareHolders.length);
        percentages = new uint256[](shareHolders.length);
        
        for (uint i = 0; i < shareHolders.length; i++) {
            holders[i] = shareHolders[i];
            shares[i] = userShares[shareHolders[i]];
            percentages[i] = totalSharesAmount > 0 ? (shares[i] * 100) / totalSharesAmount : 0;
        }
    }

    function getUserSharePercentage(address user) external view returns (uint256) {
        if (totalSharesAmount == 0) return 0;
        return (userShares[user] * 100) / totalSharesAmount;
    }

    function getTotalShares() external view returns (uint256) {
        return totalSharesAmount;
    }

    function getNFTInfo() external view returns (
        address collection,
        uint256 tokenId,
        string memory metadataURI,
        uint256 price,
        uint256 totalShares,
        address currentOwner,
        uint256 createdAt
    ) {
        return (
            nftCollection,
            nftTokenId,
            nftMetadataURI,
            sharePrice,
            totalSharesAmount,
            owner(),
            creationTime
        );
    }

    /**
     * @dev Get available shares for sale from all holders
     */
    function getAvailableShares() external view returns (uint256) {
        return totalSharesAmount; // All shares are always available for purchase
    }

    /**
     * @dev Get available shares from the current owner (creator)
     */
    function getAvailableSharesFromOwner() external view returns (uint256) {
        return userShares[owner()];
    }

    /**
     * @dev Get the original creator
     */
    function getCreator() external view returns (address) {
        return creator;
    }

    /**
     * @dev Check if user has any shares
     */
    function hasShares(address user) external view returns (bool) {
        return userShares[user] > 0;
    }

    /**
     * @dev Check if all shares are owned by the creator/owner
     */
    function isAllSharesWithOwner() external view returns (bool) {
        return userShares[owner()] == totalSharesAmount;
    }
} 