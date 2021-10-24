// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IFactoryERC721.sol";
import "./BullTycoons.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract BullTycoonsFactory is FactoryERC721, Ownable {
    using Strings for string;
    using Address for address; 

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    address public proxyRegistryAddress;
    address public wethAddress = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address public nftAddress;
    string public baseURI = "https://gateway.pinata.cloud/ipfs/QmdLYK4BKcZr5epauNVd2ufj7UtnfgeaSwXsXedmGKddD7";
    bool public MINT_START = false;

    /*
     * Enforce the existence of only 1000 BullTycoons .
     */
    uint256 TOTAL_BULL_SUPPLY = 1000;

    /*
     * Three different options for minting BullTycoons (basic, premium, and gold).
     */
    uint256 NUM_OPTIONS = 3;
    uint256 SINGLE_CREATURE_OPTION = 0;
    uint256 MULTIPLE_CREATURE_OPTION = 1;
    uint256 NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION = 4;

    constructor(address _proxyRegistryAddress, address _nftAddress) {
        proxyRegistryAddress = _proxyRegistryAddress;
        nftAddress = _nftAddress;

        fireTransferEvents(address(0), owner());
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner() {
        TOTAL_BULL_SUPPLY = _maxSupply;
    }

    function getMaxSupply() public view returns (uint256) {
        return TOTAL_BULL_SUPPLY;
    }

    function name() override external pure returns (string memory) {
        return "BullTycoons Mint";
    }

    function symbol() override external pure returns (string memory) {
        return "BTS";
    }

    function supportsFactoryInterface() override public pure returns (bool) {
        return true;
    }

    function numOptions() override public view returns (uint256) {
        return NUM_OPTIONS;
    }

    function transferOwnership(address newOwner) override public onlyOwner {
        address _prevOwner = owner();
        super.transferOwnership(newOwner);
        fireTransferEvents(_prevOwner, newOwner);
    }

    function fireTransferEvents(address _from, address _to) private {
        for (uint256 i = 0; i < NUM_OPTIONS; i++) {
            emit Transfer(_from, _to, i);
        }
    }

    /* Presale Minting: Start */

    uint public PRESALE_AMOUNT = 5 * 10 ** 16; // Equivalent of 0.05 ETH
    mapping(address => bool) addressWhitelisted;
    mapping(address => uint256) addressToMints;
    modifier addressCanMint() {
        require(!address(msg.sender).isContract() && tx.origin == msg.sender, "Contracts cannot mint.");
        _;
    }

    modifier isMintable() {
        require(MINT_START, "Mint not started");
        require(BullTycoons(nftAddress).totalSupply() < TOTAL_BULL_SUPPLY, "Maximum mint reached");
        _;
    }

    // Admin funcions start --
    // set start minting to be true or false
    function setStartMinting(bool _startMinting) public onlyOwner() {
        MINT_START = _startMinting;
    }

    // set minting price
    function setPresaleAmount(uint256 _presaleAmount) public onlyOwner() {
        PRESALE_AMOUNT = _presaleAmount;
    }

    // set whitelist addresses
    function setWhitelist(address[] memory _addresses) public onlyOwner() {
        for (uint256 i = 0; i < _addresses.length; i++) {
            addressWhitelisted[_addresses[i]] = true;
        }
    }
    // Admin functions done --

    // Whitelist start --
    
    function checkWhitelisted(address _address) public view returns(bool _isWhitelisted) {
        return addressWhitelisted[_address];
    }

    function whitelistMint() public isMintable() {
        require(addressWhitelisted[msg.sender], "Account not eligible to mint");
        BullTycoons bullTycoons = BullTycoons(nftAddress);
        bullTycoons.mintTo(msg.sender);
        addressWhitelisted[msg.sender] = false;
    }
    // Whitelist end --

    function presaleMint() public isMintable() addressCanMint() {
        require(addressToMints[msg.sender] == 0, "Already minted");
        require(IERC20(wethAddress).allowance(msg.sender, address(this)) >= PRESALE_AMOUNT, "Allowance not enough");
        BullTycoons bullTycoons = BullTycoons(nftAddress);
        IERC20(wethAddress).transferFrom(msg.sender, address(this), PRESALE_AMOUNT);
        bullTycoons.mintTo(msg.sender);
        addressToMints[msg.sender] = addressToMints[msg.sender] + 1;
    }

    function getNumberMinted(address _minter) public view returns(uint256 numberMinted) {
        return addressToMints[_minter];
    }

    /* Presale Minting: End */

    function mint(uint256 _optionId, address _toAddress) override public {
        // Must be sent from the owner proxy or owner.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        assert(
            address(proxyRegistry.proxies(owner())) == _msgSender() ||
                owner() == _msgSender()
        );
        require(canMint(_optionId));

        BullTycoons openSeaBullTycoons = BullTycoons(nftAddress);
        if (_optionId == SINGLE_CREATURE_OPTION) {
            openSeaBullTycoons.mintTo(_toAddress);
        } else if (_optionId == MULTIPLE_CREATURE_OPTION) {
            for (
                uint256 i = 0;
                i < NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION;
                i++
            ) {
                openSeaBullTycoons.mintTo(_toAddress);
            }
        }
    }

    function canMint(uint256 _optionId) override public view returns (bool) {
        if (_optionId >= NUM_OPTIONS) {
            return false;
        }

        BullTycoons bullTycoons = BullTycoons(nftAddress);
        uint256 creatureSupply = bullTycoons.totalSupply();

        uint256 numItemsAllocated = 0;
        if (_optionId == SINGLE_CREATURE_OPTION) {
            numItemsAllocated = 1;
        } else if (_optionId == MULTIPLE_CREATURE_OPTION) {
            numItemsAllocated = NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION;
        }
        return creatureSupply < (TOTAL_BULL_SUPPLY - numItemsAllocated);
    }

    function tokenURI(uint256 _optionId) override external view returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(_optionId)));
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use transferFrom so the frontend doesn't have to worry about different method names.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public {
        mint(_tokenId, _to);
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use isApprovedForAll so the frontend doesn't have to worry about different method names.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        returns (bool)
    {
        if (owner() == _owner && _owner == _operator) {
            return true;
        }

        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (
            owner() == _owner &&
            address(proxyRegistry.proxies(_owner)) == _operator
        ) {
            return true;
        }

        return false;
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use isApprovedForAll so the frontend doesn't have to worry about different method names.
     */
    function ownerOf(uint256 _tokenId) public view returns (address _owner) {
        return owner();
    }
}
