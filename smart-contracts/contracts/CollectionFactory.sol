pragma solidity ^0.8.17;

import "./FractionalNFT.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CollectionFactory {
    address public immutable implementation;

    event CollectionDeployed(address indexed collectionAddress, string collectionName, address creator);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * @dev Deploy a new collection contract (clone of FractionalNFT) and initialize it.
     */
    function createCollection(string memory _name, string memory _description) external returns (address) {
        address clone = Clones.clone(implementation);
        FractionalNFT(clone).initialize(_name, _description);
        emit CollectionDeployed(clone, _name, msg.sender);
        return clone;
    }
}
