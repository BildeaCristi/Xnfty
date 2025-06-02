// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract XnftyNFT is ERC721URIStorage {
    uint256 public nextTokenId;
    address public admin;
    string public baseURI;
    string public collectionDescription; // New variable for collection description

    // The constructor now sets the token name to "Xnfty Future Collection" and accepts a description
    constructor(string memory initialBaseURI, string memory _collectionDescription)
    ERC721("Xnfty Future Collection", "XNFT")
    {
        admin = msg.sender;
        baseURI = initialBaseURI;
        collectionDescription = _collectionDescription;
    }

    // Mint NFT and automatically set the token URI as: baseURI + tokenId + ".json"
    function mint(address to) external {
        require(msg.sender == admin, "only admin can mint");
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        // Automatically set token URI
        _setTokenURI(tokenId, string(abi.encodePacked(baseURI, _toString(tokenId), ".json")));
        nextTokenId++;
    }

    //TODO check if the tokenURI is needed
    // Internal function to convert a uint256 to a string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
