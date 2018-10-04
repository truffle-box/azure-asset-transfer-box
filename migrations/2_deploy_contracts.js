var AssetTransfer = artifacts.require('AssetTransfer');

module.exports = (deployer) => {
    deployer.deploy(AssetTransfer);
}