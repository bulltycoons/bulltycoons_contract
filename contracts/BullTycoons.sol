// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

/**
 * @title BullTycoons
 * BullTycoons - a contract for my non-fungible creatures.
 */
contract BullTycoons is ERC721Tradable {

    address public bridgeAddress;
    event BridgeMint(address _address, uint256 indexed _tokenId);
    event BridgeBurn(uint256 indexed _tokenId);
    string public contractURI;

    modifier onlyBridge() {
        require(bridgeAddress == _msgSender(), "Only bridge address");
        _;
    }

    constructor(address _proxyRegistryAddress, string memory _baseTokenUri, string memory _contractUri)
        ERC721Tradable("BullTycoons", "BTY", _proxyRegistryAddress)
    {
        baseTokenURI = _baseTokenUri;
        contractURI = _contractUri;
    }

    function _setBridgeAddress(address _bridgeAddress) public onlyOwner() {
        bridgeAddress = _bridgeAddress;
    }

    function _setBaseTokenURI(string calldata _baseTokenUri) public onlyOwner() {
        baseTokenURI = _baseTokenUri;
    }

    function _setContractURI(string calldata _contractUri) public onlyOwner() {
        contractURI = _contractUri;
    }

    /** @dev - to bridge from another network into this one 
     *  1. call bridgeBurn on the other network
     *  2. call bridgeMint on this one
     *  @param _to address of the account on this network to be minted to
     *  @param _token_id id of the token coming from the other network
    */
    function bridgeMint(address _to, uint256 _token_id) public onlyBridge() {
        // Mint the token and send it to the address who used the bridge.
        _safeMint(_to, _token_id);
        emit BridgeMint(_to, _token_id); // emit bridge mint
    }

    /** @dev - to bridge to another network from this one 
     *  1. call bridgeBurn on this network
     *  2. call bridgeMint on the other network
     *  @param _token_id id of the token coming from the other network
    */
    function bridgeBurn(uint256 _token_id) public onlyBridge() {
        // Burn the token here on this contract
        _burn(_token_id);
        emit BridgeBurn(_token_id); // emit bridge burn
    }

}
