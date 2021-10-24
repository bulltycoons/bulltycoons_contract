const BullTycoons = artifacts.require("BullTycoons");
// const BullTycoonsFactory = artifacts.require("BullTycoonsFactory");
const BullTycoonsFactoryMock = artifacts.require("BullTycoonsFactoryMock");
const WETHMock = artifacts.require("WETHMock");

module.exports = async function (deployer, network) {
    let proxyAddress = '0xce80C9fB3F2764aF138ADaE33d2618FDaf1E2DCf';
    // let canOverwrite = true;
    // if (network == 'binanceTestnet') {
    //     oracleAddress = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE';
    //     canOverwrite = false;
    // }

    if (network == 'development' || network == 'matic_mumbai') {
        await deployer.deploy(BullTycoons, proxyAddress);
        const bullTycoonNftBase = await BullTycoons.deployed();
        await deployer.deploy(WETHMock, '1000000000000000000000');
        const WethMock = await WETHMock.deployed();
        WethMock.transfer('0xfF4C5041f6C295ecac51746B4F20B14BD19a5fdf', '1000000000000000000000');
        // console.log(WethMock.address, "<== WETH Address");
        await deployer.deploy(BullTycoonsFactoryMock, proxyAddress, bullTycoonNftBase.address, WethMock.address);
        const factoryMock = await BullTycoonsFactoryMock.deployed();
        bullTycoonNftBase.transferOwnership(factoryMock.address);
    }
   
};
