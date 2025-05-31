// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./FractionalNFT.sol";

/**
 * @title NFTCollection
 * @dev ERC721 contract that can fractionalize individual NFTs
 * Each NFT can have its own fractional ownership contract
 */
contract NFTCollection is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Collection metadata stored on IPFS
    string public collectionMetadataURI;
    address public nftFactory;

    // NFT data with fractional ownership info
    struct NFTInfo {
        uint256 tokenId;
        string metadataURI;
        uint256 creationTime;
        address fractionalContract;  // Address of the FractionalNFT contract
        bool isfractionalized;
    }

    // NFT tracking
    mapping(uint256 => NFTInfo) public nfts;
    uint256 public nftCount;

    event NFTMinted(uint256 indexed tokenId, string metadataURI, address indexed owner);
    event NFTfractionalized(uint256 indexed tokenId, address indexed fractionalContract, uint256 totalShares, uint256 sharePrice);

    modifier onlyFactoryOrOwner() {
        require(msg.sender == owner() || msg.sender == nftFactory, "Not authorized");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory _collectionMetadataURI,
        address initialOwner,
        address _nftFactory
    ) ERC721(name, symbol) {
        collectionMetadataURI = _collectionMetadataURI;
        nftFactory = _nftFactory;
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Mint a new NFT with IPFS metadata
     * @param _metadataURI IPFS URI containing all NFT metadata
     */
    function mintNFT(string memory _metadataURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _mint(owner(), tokenId);
        _setTokenURI(tokenId, _metadataURI);

        nfts[tokenId] = NFTInfo({
            tokenId: tokenId,
            metadataURI: _metadataURI,
            creationTime: block.timestamp,
            fractionalContract: address(0),
            isfractionalized: false
        });

        nftCount++;
        emit NFTMinted(tokenId, _metadataURI, owner());

        return tokenId;
    }

    /**
     * @dev fractionalize an NFT by deploying a FractionalNFT contract
     * @param tokenId The NFT to fractionalize
     * @param totalShares Total number of shares to create
     * @param sharePrice Price per share in wei
     */
    function fractionalizeNFT(
        uint256 tokenId,
        uint256 totalShares,
        uint256 sharePrice,
        string memory fractionalName,
        string memory fractionalSymbol
    ) external nonReentrant returns (address) {
        require(_exists(tokenId), "NFT does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
        require(!nfts[tokenId].isfractionalized, "NFT already fractionalized");
        require(totalShares > 0, "Total shares must be greater than 0");
        require(sharePrice > 0, "Share price must be greater than 0");

        // Deploy FractionalNFT contract
        FractionalNFT fractionalContract = new FractionalNFT(
            fractionalName,
            fractionalSymbol,
            totalShares,
            sharePrice,
            address(this),
            tokenId,
            nfts[tokenId].metadataURI,
            msg.sender
        );

        // CRITICAL FIX: Grant approval to the fractional contract to transfer the NFT
        // This allows the fractional contract to transfer the NFT when someone buys all shares
        _approve(address(fractionalContract), tokenId);

        // Update NFT info
        nfts[tokenId].fractionalContract = address(fractionalContract);
        nfts[tokenId].isfractionalized = true;

        emit NFTfractionalized(tokenId, address(fractionalContract), totalShares, sharePrice);

        return address(fractionalContract);
    }

    /**
     * @dev Get all NFTs in the collection
     */
    function getAllNFTs() external view returns (NFTInfo[] memory) {
        NFTInfo[] memory allNFTs = new NFTInfo[](nftCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (bytes(nfts[i].metadataURI).length > 0) {
                allNFTs[index] = nfts[i];
                index++;
            }
        }
        
        return allNFTs;
    }

    /**
     * @dev Get fractionalized NFTs only
     */
    function getFractionalizedNFTs() external view returns (NFTInfo[] memory) {
        // Count fractionalized NFTs first
        uint256 fractionalizedCount = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (nfts[i].isfractionalized) {
                fractionalizedCount++;
            }
        }

        NFTInfo[] memory fractionalizedNFTs = new NFTInfo[](fractionalizedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (nfts[i].isfractionalized) {
                fractionalizedNFTs[index] = nfts[i];
                index++;
            }
        }
        
        return fractionalizedNFTs;
    }

    /**
     * @dev Get collection stats
     */
    function getCollectionStats() external view returns (
        uint256 totalNFTs,
        uint256 fractionalizedNFTs,
        address currentOwner
    ) {
        uint256 fractionalizedCount = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (nfts[i].isfractionalized) {
                fractionalizedCount++;
            }
        }

        return (nftCount, fractionalizedCount, owner());
    }

    function getNFT(uint256 tokenId) external view returns (NFTInfo memory) {
        require(bytes(nfts[tokenId].metadataURI).length > 0, "NFT does not exist");
        return nfts[tokenId];
    }

    function getNFTCount() external view returns (uint256) {
        return nftCount;
    }
} 