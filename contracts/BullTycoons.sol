// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

/**
 * @title BullTycoons
 * BullTycoons - a contract for my non-fungible creatures.
 */
contract BullTycoons is ERC721Tradable {
    constructor(address _proxyRegistryAddress)
        ERC721Tradable("BullTycoons", "BTY", _proxyRegistryAddress)
    {}

    function baseTokenURI() override public pure returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/QmdLYK4BKcZr5epauNVd2ufj7UtnfgeaSwXsXedmGKddD7/";
    }

    function contractURI() public pure returns (string memory) {
        return "https://creatures-api.opensea.io/contract/opensea-creatures";
    }
}
