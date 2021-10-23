// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../BullTycoonsFactory.sol";

contract BullTycoonsFactoryMock is BullTycoonsFactory {

    constructor(address _proxyRegistryAddress, address _nftAddress, address _wethAddress) BullTycoonsFactory(_proxyRegistryAddress, _nftAddress) {
        wethAddress = _wethAddress;
    }
}