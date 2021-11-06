const BullTycoonsFactoryMock = artifacts.require("BullTycoonsFactoryMock");
const BullTycoons = artifacts.require("BullTycoons");
const WethMock = artifacts.require("WETHMock");
const MockProxyRegistry = artifacts.require("MockProxyRegistry");
const truffleAssert = require('truffle-assertions');
const { BN, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require("chai");

const IS_VERBOSE = false; // change to false to hide all logs
const Logger = {
    log: (...args) => {
        if (IS_VERBOSE) {
            console.log(...args);
        }
    }
}

contract("Test BullTycoonsFactory", accounts => {

    let bullTycoonsNft, bullTycoonsFactory, token, proxyAddress;
    let mintPrice = '50000000000000000';
    const [ baseTokenUri, contractUri ] = [ "https://somebaseuri/metadatas", "https://somecontracturi" ];

    before(async() => {
        proxyAddress = await MockProxyRegistry.new();
        bullTycoonsNft = await BullTycoons.new(proxyAddress.address, baseTokenUri, contractUri);
        token = await WethMock.new('1000000000000000000000000000');
        bullTycoonsFactory = await BullTycoonsFactoryMock.new(proxyAddress.address, bullTycoonsNft.address, token.address);
        await bullTycoonsNft.transferOwnership(bullTycoonsFactory.address);

        await token.transfer(accounts[1], '100000000000000000000000000');
        await token.transfer(accounts[2], '100000000000000000000000000');
        await token.transfer(accounts[3], '100000000000000000000000000');
        await token.transfer(accounts[4], '100000000000000000000000000');

        await bullTycoonsFactory.setStartMinting(true);
        // await token.transfer(airdropper.address, '1000000000000000000000000000', {from: accounts[0]}); // Transfer of all bullcoin to airdropper
        // await airdropper.airdropToUsers([selfdropper.address], '82500000000000000000000000', {from: accounts[0]}); // Airdrop the amount required by selfdropper to function
    });

    describe("=> Presale Mint Test", () => {
        it("Tries to presaleMint bulltycoons", async () => {
            // 1. Set allowance
            const setAllowance = await token.increaseAllowance(bullTycoonsFactory.address, mintPrice);
            Logger.log(setAllowance, "<== Allowance set");
            const response = await bullTycoonsFactory.presaleMint();
            Logger.log(response, "<== Presale Mint Value");
        });
    });

    describe("=> Should fail all tests", () => {
        it("Should revert based on the fact that minting has not started", async () => {
            await bullTycoonsFactory.setStartMinting(false);
            const response = bullTycoonsFactory.presaleMint();
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Mint not started");
            await bullTycoonsFactory.setStartMinting(true);
        });

        it("Should revert based on low allowance", async () => {
            const response = bullTycoonsFactory.presaleMint({from: accounts[1]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Allowance not enough");
        });

        // it("Should revert based on the fact that contract cannot mint", async () => {
        //     const response = bullTycoonsFactory.presaleMint({from: token.address});
        //     await truffleAssert.fails(response, truffleAssert.ErrorType.ERROR, "Contracts cannot mint.");
        // });

        it("Should revert based on the fact that someone cannot mint twice", async () => {
            const setAllowance = await token.increaseAllowance(bullTycoonsFactory.address, mintPrice, {from: accounts[2]});
            const response = bullTycoonsFactory.presaleMint({from: accounts[2]});

            const setAllowance1 = await token.increaseAllowance(bullTycoonsFactory.address, mintPrice, {from: accounts[2]});
            const response2 = bullTycoonsFactory.presaleMint({from: accounts[2]});

            await truffleAssert.fails(response2, truffleAssert.ErrorType.REVERT, "Already minted");
        });

        it("Should revert based on the fact that max is reached", async () => {
            await bullTycoonsFactory.setMaxSupply(0);
            const setAllowance = await token.increaseAllowance(bullTycoonsFactory.address, mintPrice, {from: accounts[2]});
            const response = bullTycoonsFactory.presaleMint({from: accounts[2]});

            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Maximum mint reached");
            await bullTycoonsFactory.setMaxSupply(1000);
        });
    });

    describe("==> Should get all the details from the NFT contract", () => {
        it("should get the number of NFTs created", async () => {
            const response = await bullTycoonsNft.totalSupply();
            Logger.log(BN(response).toString(), "<== Total supply");
        });

        it("should get the number of NFT minted by user", async () => {
            const response = await bullTycoonsFactory.getNumberMinted(accounts[0]);
            Logger.log(BN(response).toString(), "<== Total Minted");
        });

        it("should get the number of Total NFTs", async () => {
            const response = await bullTycoonsFactory.getMaxSupply();
            Logger.log(BN(response).toString(), "<== Max supply");
        });

        it("should get the presale amount", async () => {
            const response = await bullTycoonsFactory.PRESALE_AMOUNT();
            Logger.log(BN(response).toString(), "<== PRESALE AMOUNT");
        });

        it("should get the URI of a token", async () => {
            const response = await bullTycoonsNft.tokenURI(45);
            Logger.log(response, "<== Token URI");
        });
    });

    describe("==> Should do all whitelisting things", () => {
        it("should add whitelisted addresses", async () => {
            const response = await bullTycoonsFactory.setWhitelist([accounts[1],accounts[2]]);
            Logger.log(response, "<== Added to whitelist");
        });

        it("should fail to whitelist addresses because -- not owner of smartcontract", async () => {
            const response = bullTycoonsFactory.setWhitelist([accounts[1],accounts[2]], {from: accounts[5]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Ownable: caller is not the owner");
        });

        it("should check if a user is whitelisted", async () => {
            const response1 = await bullTycoonsFactory.checkWhitelisted(accounts[0]);
            Logger.log(response1, "<== Should be false");
            const response2 = await bullTycoonsFactory.checkWhitelisted(accounts[1]);
            Logger.log(response2, "<== Should be true");
        });

        it("should mint for a whitelisted account", async () => {
            const response = await bullTycoonsFactory.whitelistMint({from: accounts[1]});
            Logger.log(response, "<== Should mint for this account");
        });

        it("should not mint for a non-whitelisted account", async () => {
            const response = bullTycoonsFactory.whitelistMint({from: accounts[0]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Account not eligible to mint");
        });
    })

    describe("==> Should perform all the URI actions", () => {
        it("should display the basic information about the contract", async () => {
            const _baseTokenUri = await bullTycoonsNft.baseTokenURI();
            const _contractUri = await bullTycoonsNft.contractURI();
            Logger.log(_baseTokenUri, _contractUri, "<== BaseTokenUri & ContractUri");
        });

        it("should change the baseTokenUri", async () => {
            const newBaseUri = "https://somenewbaseuri/metadatas/";
            const response = await bullTycoonsFactory.setBaseTokenUri(newBaseUri);
            Logger.log(response, "<== Change BaseURI")
            // confirm it has changed
            const _baseTokenUri = await bullTycoonsNft.baseTokenURI();
            Logger.log(_baseTokenUri, "<== New Base Token URI");
            assert(_baseTokenUri == newBaseUri, "Changed base token URI does not match");
        });

        it("should fail to change baseTokenUri - not owner", async() => {
            const newBaseUri = "https://somenewbaseuri/metadatas/";
            const response = bullTycoonsFactory.setBaseTokenUri(newBaseUri, {from: accounts[5]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "caller is not the owner");
        })

        it("should change the contractUri", async () => {
            const newContractUri = "https://somenewcontracturi/";
            const response = await bullTycoonsFactory.setContractUri(newContractUri);
            Logger.log(response, "<== Change Contract URI")
            // confirm it has changed
            const _contractUri = await bullTycoonsNft.contractURI();
            Logger.log(_contractUri, "<== New Contract URI");
            assert(_contractUri == newContractUri, "Changed contract URI does not match");
        });

        it("should fail to change the contractUri - not owner", async () => {
            const newContractUri = "https://somenewcontracturi/";
            const response = bullTycoonsFactory.setContractUri(newContractUri, {from: accounts[5]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "caller is not the owner");
        });

        it("should change bridge address", async () => {
            const getBridgeAddr = await bullTycoonsNft.bridgeAddress();
            Logger.log(getBridgeAddr, "<== Current Bridge Address")
            // now change the bridge address
            const response = await bullTycoonsFactory.setBridgeAddress(accounts[0]);
            Logger.log(response, "<== Changing the bridge address");
            // now check the new bridge address
            const getNewBridgeAddr = await bullTycoonsNft.bridgeAddress();
            Logger.log(getNewBridgeAddr, "<== New Bridge Address");
            assert(accounts[0] == getNewBridgeAddr, "Bridge address does not match");
        });

        it("should fail to change bridge address - not owner", async () => {
            const response = bullTycoonsFactory.setBridgeAddress(accounts[1], {from: accounts[5]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "caller is not the owner");
        });
    });

    describe("==> Run all bridge related tests", () => {
        it("should fail to brigeMint - not bridge", async () => {
            const response = bullTycoonsNft.bridgeMint(accounts[1], 1, {from: accounts[2]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Only bridge address");
        });

        it("should fail to brigeBurn - not bridge", async () => {
            const response = bullTycoonsNft.bridgeBurn(1, {from: accounts[2]});
            await truffleAssert.fails(response, truffleAssert.ErrorType.REVERT, "Only bridge address");
        });

        it("should mint token with bridge", async () => {
            const response = await bullTycoonsNft.bridgeMint(accounts[1], 10, {from: accounts[0]});
            Logger.log(JSON.stringify(response), "<== Mint token on the chain");
        });

        it("should burn token with bridge", async () => {
            const response = await bullTycoonsNft.bridgeBurn(10, {from: accounts[0]});
            Logger.log(JSON.stringify(response), "<== Burn token on the chain");
        });
    })

});