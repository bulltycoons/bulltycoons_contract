const BullTycoonsFactoryMock = artifacts.require("BullTycoonsFactoryMock");
const BullTycoons = artifacts.require("BullTycoons");
const WethMock = artifacts.require("WETHMock");
const MockProxyRegistry = artifacts.require("MockProxyRegistry");
const truffleAssert = require('truffle-assertions');

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
    })

});