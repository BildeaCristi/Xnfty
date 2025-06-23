// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFTCollection.sol";

/**
 * @title NFTFactory
 * @dev Lightweight factory contract to create NFT collections
 * Heavy view functions moved to NFTFactoryView for size optimization
 */
contract NFTFactory is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _collectionIdCounter;

    struct CollectionInfo {
        uint256 collectionId;
        string metadataURI;
        address collectionAddress;
        address owner;
        uint256 creationTime;
    }

    mapping(uint256 => CollectionInfo) public collections;
    mapping(address => uint256[]) public userCollections;
    address[] public collectionAddresses;

    event CollectionCreated(
        uint256 indexed collectionId,
        address indexed collectionAddress,
        address owner,
        string metadataURI
    );

    function createCollection(
        string memory name,
        string memory symbol,
        string memory metadataURI
    ) external returns (uint256) {
        uint256 collectionId = _collectionIdCounter.current();
        _collectionIdCounter.increment();

        NFTCollection nftCollection = new NFTCollection(
            name,
            symbol,
            metadataURI,
            msg.sender,
            address(this)
        );

        collections[collectionId] = CollectionInfo({
            collectionId: collectionId,
            metadataURI: metadataURI,
            collectionAddress: address(nftCollection),
            owner: msg.sender,
            creationTime: block.timestamp
        });

        userCollections[msg.sender].push(collectionId);
        collectionAddresses.push(address(nftCollection));

        emit CollectionCreated(
            collectionId,
            address(nftCollection),
            msg.sender,
            metadataURI
        );

        return collectionId;
    }

    function getUserCollections(address user) external view returns (uint256[] memory) {
        return userCollections[user];
    }

    function getCollection(uint256 collectionId) external view returns (CollectionInfo memory) {
        return collections[collectionId];
    }

    function getAllCollections() external view returns (CollectionInfo[] memory) {
        uint256 totalCollections = _collectionIdCounter.current();
        CollectionInfo[] memory allCollections = new CollectionInfo[](totalCollections);
        
        for (uint256 i = 0; i < totalCollections; i++) {
            allCollections[i] = collections[i];
        }
        
        return allCollections;
    }

    function getCollectionCount() external view returns (uint256) {
        return _collectionIdCounter.current();
    }

    function getAllCollectionAddresses() external view returns (address[] memory) {
        return collectionAddresses;
    }

    function getUserOwnedCollections(address user) external view returns (CollectionInfo[] memory) {
        uint256[] memory userCollectionIds = userCollections[user];
        CollectionInfo[] memory ownedCollections = new CollectionInfo[](userCollectionIds.length);
        
        for (uint256 i = 0; i < userCollectionIds.length; i++) {
            ownedCollections[i] = collections[userCollectionIds[i]];
        }
        
        return ownedCollections;
    }
} 