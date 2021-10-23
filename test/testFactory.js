const BullTycoonsFactoryMock = artifacts.require("BullTycoonsFactoryMock");
const BullTycoons = artifacts.require("BullTycoons");
const WethMock = artifacts.require("WETHMock");
const MockProxyRegistry = artifacts.require("MockProxyRegistry");
const truffleAssert = require('truffle-assertions');
const { BN, time } = require('@openzeppelin/test-helpers');

const IS_VERBOSE = true; // change to false to hide all logs
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

    before(async() => {
        proxyAddress = await MockProxyRegistry.new();
        bullTycoonsNft = await BullTycoons.new(proxyAddress.address);
        token = await WethMock.new('1000000000000000000000000000');
        bullTycoonsFactory = await BullTycoonsFactoryMock.new(proxyAddress.address, bullTycoonsNft.address, token.address);
        await bullTycoonsNft.transferOwnership(bullTycoonsFactory.address);

        await token.transfer(accounts[1], '100000000000000000000000000');
        await token.transfer(accounts[2], '100000000000000000000000000');
        await token.transfer(accounts[3], '100000000000000000000000000');
        await token.transfer(accounts[4], '100000000000000000000000000');
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

});