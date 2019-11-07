const AssetTransfer = artifacts.require('AssetTransfer');
const truffleAssert = require('truffle-assertions');

/**
 * Run test with new deployed contract.
 *
 * Note: Truffle only redeploys contract before each contract() function is run, but not it() function. It is important to
 * create clean room for each test case. The helper wraps up common code.
 * https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 * @param {string} description
 *   Test description
 * @param {function} callback
 *   Test body
 */
function runTest(description, callback) {
    contract('', () => {
        it(description, callback);
    });
}

contract('AssetTransfer', (accounts) => {
    let assetTransfer;
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const owner = accounts[0];
    const buyer = accounts[1];
    const appraiser = accounts[2];
    const inspector = accounts[3];

    contract('Initialization', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        runTest('should return a new instance of the contract', async () => {
            const description = await assetTransfer.Description();
            const price = await assetTransfer.AskingPrice();
            assert.equal(description, 'testdescription', 'Default description not set to proper value.');
            assert.equal(price.toNumber(), 1, 'Price was not set to the expected value of 1.');
        });
    })

    contract('MakeOffer', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        runTest('offer price should be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 0, { from: buyer }));
        });

        runTest('inspector address cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(zeroAddress, appraiser, 1, { from: buyer }));
        });

        runTest('appraiser address cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, zeroAddress, 1, { from: buyer }));
        });

        runTest('state should only be active', async () => {
            // after the following transaction, the state will not be active
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer }));
        });

        runTest('ownder should not make an offer', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 1, { from: owner }));
        });

        runTest('should update instance', async () => {
            assetTransfer = await AssetTransfer.deployed();
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            var offerPrice = await assetTransfer.OfferPrice();
            var state = await assetTransfer.State();

            assert.equal(1, offerPrice, 'offer price was not set to proper value');
            assert.equal(1, state, 'state was not set to OfferPlaced');
        });
    })

    contract('Terminate', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.deployed();
        });

        runTest('non-owner cannot terminate', async () => {
            await truffleAssert.reverts(assetTransfer.Terminate({ from: buyer }));
        });

        runTest('owner can terminate', async () => {
            await assetTransfer.Terminate({ from: owner });
            const state = await assetTransfer.State();

            assert.equal(9, state);
        });
    });
});