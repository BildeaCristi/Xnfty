// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTFactory.sol";
import "./NFTCollection.sol";
import "./FractionalNFT.sol";

/**
 * @title NFTFactoryView
 * @dev View-only contract with heavy computation functions
 * Separated from NFTFactory to solve contract size limits
 */
contract NFTFactoryView {
    NFTFactory public immutable factory;

    struct UserNFTInfo {
        uint256 collectionId;
        address collectionAddress;
        uint256 tokenId;
        address fractionalContract;
        uint256 userShares;
        uint256 totalShares;
        uint256 sharePercentage;
        string metadataURI;
        bool isOwner;
    }

    struct NFTInfo {
        uint256 tokenId;
        address fractionalContract;
        string metadataURI;
        uint256 totalShares;
        address currentOwner;
        uint256 sharePrice;
        bool isfractionalized;
        uint256 creationTime;
    }

    struct CollectionNFTInfo {
        uint256 collectionId;
        string metadataURI;
        address collectionAddress;
        address owner;
        uint256 creationTime;
        uint256 nftCount;
        uint256 fractionalizedCount;
    }

    constructor(address _factory) {
        factory = NFTFactory(_factory);
    }

    /**
     * @dev Get all NFTs from a specific collection with their fractional info
     * @param collectionAddress Address of the collection contract
     * @return NFTInfo[] Array of NFTs with fractional information
     */
    function getCollectionNFTs(address collectionAddress) external view returns (NFTInfo[] memory) {
        NFTCollection collection = NFTCollection(collectionAddress);
        
        try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
            NFTInfo[] memory result = new NFTInfo[](nfts.length);
            
            for (uint256 i = 0; i < nfts.length; i++) {
                NFTCollection.NFTInfo memory nft = nfts[i];
                
                if (nft.isfractionalized && nft.fractionalContract != address(0)) {
                    try FractionalNFT(nft.fractionalContract).getNFTInfo() returns (
                        address,
                        uint256,
                        string memory,
                        uint256 price,
                        uint256 totalShares,
                        address currentOwner,
                        uint256
                    ) {
                        result[i] = NFTInfo({
                            tokenId: nft.tokenId,
                            fractionalContract: nft.fractionalContract,
                            metadataURI: nft.metadataURI,
                            totalShares: totalShares,
                            currentOwner: currentOwner,
                            sharePrice: price,
                            isfractionalized: true,
                            creationTime: nft.creationTime
                        });
                    } catch {
                        result[i] = NFTInfo({
                            tokenId: nft.tokenId,
                            fractionalContract: nft.fractionalContract,
                            metadataURI: nft.metadataURI,
                            totalShares: 0,
                            currentOwner: address(0),
                            sharePrice: 0,
                            isfractionalized: nft.isfractionalized,
                            creationTime: nft.creationTime
                        });
                    }
                } else {
                    result[i] = NFTInfo({
                        tokenId: nft.tokenId,
                        fractionalContract: nft.fractionalContract,
                        metadataURI: nft.metadataURI,
                        totalShares: 0,
                        currentOwner: address(0),
                        sharePrice: 0,
                        isfractionalized: nft.isfractionalized,
                        creationTime: nft.creationTime
                    });
                }
            }
            
            return result;
        } catch {
            return new NFTInfo[](0);
        }
    }

    /**
     * @dev Get simplified list of NFTs where a user has shares
     * @param user Address of the user
     * @return UserNFTInfo[] Array of NFTs where the user has shares
     */
    function getUserNFTShares(address user) external view returns (UserNFTInfo[] memory) {
        address[] memory collectionAddresses = factory.getAllCollectionAddresses();
        
        uint256 userNFTCount = 0;
        
        for (uint256 i = 0; i < collectionAddresses.length; i++) {
            NFTCollection collection = NFTCollection(collectionAddresses[i]);
            
            try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                for (uint256 j = 0; j < nfts.length; j++) {
                    if (nfts[j].isfractionalized && nfts[j].fractionalContract != address(0)) {
                        try FractionalNFT(nfts[j].fractionalContract).userShares(user) returns (uint256 shares) {
                            if (shares > 0) {
                                userNFTCount++;
                            }
                        } catch {}
                    }
                }
            } catch {}
        }

        UserNFTInfo[] memory userNFTs = new UserNFTInfo[](userNFTCount);
        uint256 index = 0;

        for (uint256 i = 0; i < collectionAddresses.length && index < userNFTCount; i++) {
            NFTCollection collection = NFTCollection(collectionAddresses[i]);
            
            uint256 collectionId = 0;
            for (uint256 k = 0; k < factory.getCollectionCount(); k++) {
                NFTFactory.CollectionInfo memory collectionInfo = factory.getCollection(k);
                if (collectionInfo.collectionAddress == collectionAddresses[i]) {
                    collectionId = k;
                    break;
                }
            }
            
            try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                for (uint256 j = 0; j < nfts.length && index < userNFTCount; j++) {
                    if (nfts[j].isfractionalized && nfts[j].fractionalContract != address(0)) {
                        try FractionalNFT(nfts[j].fractionalContract).userShares(user) returns (uint256 shares) {
                            if (shares > 0) {
                                // Get additional info
                                uint256 totalShares = 0;
                                uint256 sharePercentage = 0;
                                bool isOwner = false;
                                
                                try FractionalNFT(nfts[j].fractionalContract).getTotalShares() returns (uint256 total) {
                                    totalShares = total;
                                    sharePercentage = total > 0 ? (shares * 100) / total : 0;
                                } catch {}
                                
                                try FractionalNFT(nfts[j].fractionalContract).owner() returns (address owner) {
                                    isOwner = (owner == user);
                                } catch {}
                                
                                userNFTs[index] = UserNFTInfo({
                                    collectionId: collectionId,
                                    collectionAddress: collectionAddresses[i],
                                    tokenId: nfts[j].tokenId,
                                    fractionalContract: nfts[j].fractionalContract,
                                    userShares: shares,
                                    totalShares: totalShares,
                                    sharePercentage: sharePercentage,
                                    metadataURI: nfts[j].metadataURI,
                                    isOwner: isOwner
                                });
                                index++;
                            }
                        } catch {}
                    }
                }
            } catch {}
        }

        return userNFTs;
    }

    /**
     * @dev Get all NFTs where shares exist (fractionalized NFTs)
     * @return UserNFTInfo[] Array of all fractionalized NFTs
     */
    function getAllFractionalizedNFTs() external view returns (UserNFTInfo[] memory) {
        address[] memory collectionAddresses = factory.getAllCollectionAddresses();
        
        uint256 fractionalizedCount = 0;
        
        for (uint256 i = 0; i < collectionAddresses.length; i++) {
            NFTCollection collection = NFTCollection(collectionAddresses[i]);
            
            try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                for (uint256 j = 0; j < nfts.length; j++) {
                    if (nfts[j].isfractionalized && nfts[j].fractionalContract != address(0)) {
                        fractionalizedCount++;
                    }
                }
            } catch {}
        }

        UserNFTInfo[] memory fractionalizedNFTs = new UserNFTInfo[](fractionalizedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < collectionAddresses.length && index < fractionalizedCount; i++) {
            NFTCollection collection = NFTCollection(collectionAddresses[i]);
            
            uint256 collectionId = 0;
            for (uint256 k = 0; k < factory.getCollectionCount(); k++) {
                NFTFactory.CollectionInfo memory collectionInfo = factory.getCollection(k);
                if (collectionInfo.collectionAddress == collectionAddresses[i]) {
                    collectionId = k;
                    break;
                }
            }
            
            try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                for (uint256 j = 0; j < nfts.length && index < fractionalizedCount; j++) {
                    if (nfts[j].isfractionalized && nfts[j].fractionalContract != address(0)) {
                        uint256 totalShares = 0;
                        address currentOwner = address(0);
                        
                        try FractionalNFT(nfts[j].fractionalContract).getTotalShares() returns (uint256 total) {
                            totalShares = total;
                        } catch {}
                        
                        try FractionalNFT(nfts[j].fractionalContract).owner() returns (address owner) {
                            currentOwner = owner;
                        } catch {}
                        
                        fractionalizedNFTs[index] = UserNFTInfo({
                            collectionId: collectionId,
                            collectionAddress: collectionAddresses[i],
                            tokenId: nfts[j].tokenId,
                            fractionalContract: nfts[j].fractionalContract,
                            userShares: 0, // Not specific to any user
                            totalShares: totalShares,
                            sharePercentage: 0,
                            metadataURI: nfts[j].metadataURI,
                            isOwner: false
                        });
                        index++;
                    }
                }
            } catch {}
        }

        return fractionalizedNFTs;
    }

    /**
     * @dev Get collections where user has any shares in NFTs
     * @param user Address of the user
     * @return CollectionInfo[] Array of collections where user has shares
     */
    function getCollectionsWithUserShares(address user) external view returns (NFTFactory.CollectionInfo[] memory) {
        address[] memory collectionAddresses = factory.getAllCollectionAddresses();
        
        // First pass: count collections with user shares
        uint256 collectionsWithSharesCount = 0;
        bool[] memory hasSharesInCollection = new bool[](collectionAddresses.length);
        
        for (uint256 i = 0; i < collectionAddresses.length; i++) {
            NFTCollection collection = NFTCollection(collectionAddresses[i]);
            
            try collection.getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                for (uint256 j = 0; j < nfts.length; j++) {
                    if (nfts[j].isfractionalized && nfts[j].fractionalContract != address(0)) {
                        try FractionalNFT(nfts[j].fractionalContract).userShares(user) returns (uint256 shares) {
                            if (shares > 0) {
                                if (!hasSharesInCollection[i]) {
                                    hasSharesInCollection[i] = true;
                                    collectionsWithSharesCount++;
                                }
                                break; // Found shares in this collection, move to next collection
                            }
                        } catch {}
                    }
                }
            } catch {}
        }

        // Second pass: populate result array
        NFTFactory.CollectionInfo[] memory result = new NFTFactory.CollectionInfo[](collectionsWithSharesCount);
        uint256 index = 0;

        for (uint256 i = 0; i < collectionAddresses.length && index < collectionsWithSharesCount; i++) {
            if (hasSharesInCollection[i]) {
                for (uint256 k = 0; k < factory.getCollectionCount(); k++) {
                    NFTFactory.CollectionInfo memory collectionInfo = factory.getCollection(k);
                    if (collectionInfo.collectionAddress == collectionAddresses[i]) {
                        result[index] = collectionInfo;
                        index++;
                        break;
                    }
                }
            }
        }

        return result;
    }

    /**
     * @dev Get collection info with NFT statistics
     * @return CollectionNFTInfo[] Array of collections with NFT counts
     */
    function getCollectionsWithNFTInfo() external view returns (CollectionNFTInfo[] memory) {
        NFTFactory.CollectionInfo[] memory collections = factory.getAllCollections();
        CollectionNFTInfo[] memory result = new CollectionNFTInfo[](collections.length);
        
        for (uint256 i = 0; i < collections.length; i++) {
            uint256 nftCount = 0;
            uint256 fractionalizedCount = 0;
            
            try NFTCollection(collections[i].collectionAddress).getAllNFTs() returns (NFTCollection.NFTInfo[] memory nfts) {
                nftCount = nfts.length;
                
                for (uint256 j = 0; j < nfts.length; j++) {
                    if (nfts[j].isfractionalized) {
                        fractionalizedCount++;
                    }
                }
            } catch {}
            
            result[i] = CollectionNFTInfo({
                collectionId: collections[i].collectionId,
                metadataURI: collections[i].metadataURI,
                collectionAddress: collections[i].collectionAddress,
                owner: collections[i].owner,
                creationTime: collections[i].creationTime,
                nftCount: nftCount,
                fractionalizedCount: fractionalizedCount
            });
        }
        
        return result;
    }
} 