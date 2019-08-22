const AssetTransfer = artifacts.require('AssetTransfer');

contract('AssetTransfer', (accounts) => {
    it('should return a new instance of the contract', async () => {
        const assetTransfer = await AssetTransfer.deployed();
        const description = await assetTransfer.Description();
        const price = await assetTransfer.AskingPrice();
        assert.equal(description, 'testdescription', 'Default description not set to proper value.');
        assert.equal(price.toNumber(), 1, 'Price was not set to the expected value of 1.');
    });
});