const BullTycoons = artifacts.require("BullTycoons");
const BullTycoonsFactory = artifacts.require("BullTycoonsFactory");

module.exports = async function (deployer, network) {
    let proxyAddress = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE';
    // let canOverwrite = true;
    // if (network == 'binanceTestnet') {
    //     oracleAddress = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE';
    //     canOverwrite = false;
    // }
    await deployer.deploy(BullTycoons, proxyAddress);
    const bullTycoonNftBase = await BullTycoons.deployed();
    await deployer.deploy(BullTycoonsFactory, proxyAddress, bullTycoonNftBase.address);
};
