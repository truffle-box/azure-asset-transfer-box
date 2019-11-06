const AssetTransfer = artifacts.require('AssetTransfer');
const truffleAssert = require('truffle-assertions');

contract('AssetTransfer', (accounts) => {
    let assetTransfer;
    const owner = accounts[0];
    const buyer = accounts[1];
    const appraiser = accounts[2];
    const inspector = accounts[3];

    describe('Initialization', () => {
        beforeEach('setup for Initialization', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        it('should return a new instance of the contract', async () => {
            const description = await assetTransfer.Description();
            const price = await assetTransfer.AskingPrice();
            assert.equal(description, 'testdescription', 'Default description not set to proper value.');
            assert.equal(price.toNumber(), 1, 'Price was not set to the expected value of 1.');
        });
    })

    describe('MakeOffer', () => {
        beforeEach('setup for MakeOffer', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        it('offer price should be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 0, { from: buyer }));
        });

        it('inspector address cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer('0x0000000000000000000000000000000000000000', appraiser, 1, { from: buyer }));
        });

        it('ownder should not make an offer', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 1, { from: owner }));
        });

        it('should update instance', async () => {
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            var offerPrice = await assetTransfer.OfferPrice();
            var state = await assetTransfer.State();

            assert.equal(1, offerPrice, 'offer price was not set to proper value');
            assert.equal(1, state, 'state was not set to OfferPlaced');
        });
    })

    describe('Terminate', () => {
        beforeEach('setup for Terminate', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        it('non-owner cannot terminate', async () => {
            await truffleAssert.reverts(assetTransfer.Terminate({ from: buyer }));
        });

        it('owner can terminate', async () => {
            await assetTransfer.Terminate({ from: owner });
            const state = await assetTransfer.State();

            assert.equal(9, state);
        });
    });
});