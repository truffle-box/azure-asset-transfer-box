const AssetTransfer = artifacts.require('AssetTransfer');
const truffleAssert = require('truffle-assertions');

contract('AssetTransfer', (accounts) => {
    let assetTransfer;
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const owner = accounts[0];
    const buyer = accounts[1];
    const appraiser = accounts[2];
    const inspector = accounts[3];

    describe('constructor', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
        });

        it('should return a new instance of the contract', async () => {
            var description = await assetTransfer.Description();
            var price = await assetTransfer.AskingPrice();
            assert.equal(description, 'testdescription', 'Default description not set to proper value.');
            assert.equal(price.toNumber(), 1, 'Price was not set to the expected value of 1.');
        });
    })

    describe('MakeOffer', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
        });

        it('offer price should be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 0, { from: buyer }));
        });

        it('inspector address cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(zeroAddress, appraiser, 1, { from: buyer }));
        });

        it('appraiser address cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, zeroAddress, 1, { from: buyer }));
        });

        it('state should only be active', async () => {
            // after the following transaction, the state will not be active
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer }));
        });

        it('ownder should not make an offer', async () => {
            await truffleAssert.reverts(assetTransfer.MakeOffer(inspector, appraiser, 1, { from: owner }));
        });

        it('should update contract', async () => {
            assetTransfer = await AssetTransfer.deployed();
            var result = await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            var offerPrice = await assetTransfer.OfferPrice();
            var state = await assetTransfer.State();

            assert.equal(1, offerPrice, 'offer price was not set to proper value');
            assert.equal(1, state, 'state was not set to OfferPlaced');
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'MakeOffer';
            }, 'Contract should return the correct message');
        });
    })

    describe('Terminate', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
        });

        it('non-owner cannot terminate', async () => {
            await truffleAssert.reverts(assetTransfer.Terminate({ from: buyer }));
        });

        it('owner can terminate', async () => {
            var result = await assetTransfer.Terminate({ from: owner });
            var state = await assetTransfer.State();

            assert.equal(9, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Terminate';
            }, 'Contract should return the correct message');
        });
    });

    describe('Modify', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
        });

        it('state should only be active', async () => {
            // after the following transaction, the state will not be active
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.Modify('owner updates the price', 2, { from: owner }));
        });

        it('only owner can modify', async () => {
            await truffleAssert.reverts(assetTransfer.Modify('buyer tries to update the price', 2, { from: buyer }));
        });

        it('should modify contract', async () => {
            var result = await assetTransfer.Modify('owner updates the price', 2, { from: owner });
            var state = await assetTransfer.State();

            assert.equal(0, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Modify';
            }, 'Contract should return the correct message');
        });
    });

    describe('ModifyOffer', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
        });

        it('state should only be offerplaced', async () => {
            // after the following transaction, the state will not be offerplaced
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.ModifyOffer(2, { from: buyer }));
        });

        it('only buyer can modify offer', async () => {
            await truffleAssert.reverts(assetTransfer.ModifyOffer(2, { from: owner }));
        });

        it('offer price cannot be zero', async () => {
            await truffleAssert.reverts(assetTransfer.ModifyOffer(0, { from: buyer }));
        });

        it('should modify offer', async () => {
            var result = await assetTransfer.ModifyOffer(2, { from: buyer });
            var state = await assetTransfer.State();

            assert.equal(1, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'ModifyOffer';
            }, 'Contract should return the correct message');
        });
    });

    describe('AcceptOffer', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
        });

        it('state should only be offer placed', async () => {
            // after the following transaction, the state will not be offerplaced
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.AcceptOffer({ from: owner }));
        });

        it('only owner can accept offer', async () => {
            await truffleAssert.reverts(assetTransfer.AcceptOffer({ from: buyer }));
        });

        it('should update contract', async () => {
            var result = await assetTransfer.AcceptOffer({ from: owner });
            var state = await assetTransfer.State();

            assert.equal(2, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'AcceptOffer';
            }, 'Contract should return the correct message');
        });
    });

    describe('MarkAppraised', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            await assetTransfer.AcceptOffer({ from: owner });
        });

        it('only appraiser can mark appraised', async () => {
            await truffleAssert.reverts(assetTransfer.MarkAppraised({ from: owner }));
        });

        it('state can only be pending inspection or inspected', async () => {
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.MarkAppraised({ from: appraiser }));
        });

        it('should update contract if state is pending inspection', async () => {
            var result = await assetTransfer.MarkAppraised({ from: appraiser });
            var state = await assetTransfer.State();

            assert.equal(4, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'MarkAppraised';
            }, 'Contract should return the correct message');
        });

        it('should update contract if state is inspected', async () => {
            await assetTransfer.MarkInspected({ from: inspector });
            var result = await assetTransfer.MarkAppraised({ from: appraiser });
            var state = await assetTransfer.State();

            assert.equal(5, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'MarkAppraised';
            }, 'Contract should return the correct message');
        });
    });

    describe('MarkInspected', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            await assetTransfer.AcceptOffer({ from: owner });
        });

        it('only inspector can mark inspected', async () => {
            await truffleAssert.reverts(assetTransfer.MarkInspected({ from: owner }));
        })

        it('state can only be either pending inspection or appraised', async () => {
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.MarkInspected({ from: inspector }));
        });

        it('should update instance if state is pending inspection', async () => {
            var result = await assetTransfer.MarkInspected({ from: inspector });
            var state = await assetTransfer.State();

            assert.equal(3, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'MarkInspected';
            }, 'Contract should return the correct message');
        });

        it('should update instance if state is appraised', async () => {
            await assetTransfer.MarkAppraised({ from: appraiser });
            var result = await assetTransfer.MarkInspected({ from: inspector });
            var state = await assetTransfer.State();

            assert.equal(5, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'MarkInspected';
            }, 'Contract should return the correct message');
        });
    });

    describe('Reject', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
        });

        it('state cannot be anything', async () => {
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.Reject({ from: owner }));
        });

        it('only owner can reject', async () => {
            await truffleAssert.reverts(assetTransfer.Reject({ from: buyer }));
        });

        it('should update instace', async () => {
            var result = await assetTransfer.Reject({ from: owner });
            var state = await assetTransfer.State();

            assert.equal(0, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Reject';
            }, 'Contract should return the correct message');
        })
    });

    describe('RescindOffer', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
        });

        it('state cannot be anything', async () => {
            await assetTransfer.Terminate({ from: owner });

            await truffleAssert.reverts(assetTransfer.RescindOffer({ from: buyer }));
        });

        it('only buyer can rescind offer', async () => {
            await truffleAssert.reverts(assetTransfer.RescindOffer({ from: owner }));
        });

        it('should update instance', async () => {
            var result = await assetTransfer.RescindOffer({ from: buyer });
            var instanceBuyer = await assetTransfer.InstanceBuyer();
            var offerPrice = await assetTransfer.OfferPrice();
            var state = await assetTransfer.State();

            assert.equal(zeroAddress, instanceBuyer);
            assert.equal(0, offerPrice);
            assert.equal(0, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'RescindOffer';
            }, 'Contract should return the correct message');
        });
    })

    describe('Accept', () => {
        beforeEach('setup', async function() {
            assetTransfer = await AssetTransfer.new('testdescription', 1);
            await assetTransfer.MakeOffer(inspector, appraiser, 1, { from: buyer });
            await assetTransfer.AcceptOffer({ from: owner });
            await assetTransfer.MarkInspected({ from: inspector });
            await assetTransfer.MarkAppraised({ from: appraiser });
        });

        it('only owner or buyer can accept', async () => {
            await truffleAssert.reverts(assetTransfer.Accept({ from: inspector }));
        });

        it('owner can only accept at two states', async () => {
            await assetTransfer.Accept({ from: owner });
            await assetTransfer.Accept({ from: buyer });

            // now at Accepted state
            await truffleAssert.reverts(assetTransfer.Accept({ from: owner }));
        });

        it('buyer can only accept at two states', async () => {
            await assetTransfer.Accept({ from: owner });
            await assetTransfer.Accept({ from: buyer });

            // now at Accepted state
            await truffleAssert.reverts(assetTransfer.Accept({ from: buyer }));
        });

        it('should update instance after buyer accepts at NotionalAcceptance', async () => {
            var result = await assetTransfer.Accept({ from: buyer });
            var state = await assetTransfer.State();

            assert.equal(6, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Accept';
            }, 'Contract should return the correct message');
        });

        it('should update instance after owner accepts at NotionalAcceptance', async () => {
            var result = await assetTransfer.Accept({ from: owner });
            var state = await assetTransfer.State();

            assert.equal(7, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Accept';
            }, 'Contract should return the correct message');
        });

        it('should update instance after buyer accepts at SellerAccepted', async () => {
            await assetTransfer.Accept({ from: owner });

            var result = await assetTransfer.Accept({ from: buyer });
            var state = await assetTransfer.State();

            assert.equal(8, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Accept';
            }, 'Contract should return the correct message');
        });

        it('should update instance after owner accepts at BuyerAccepted', async () => {
            await assetTransfer.Accept({ from: buyer });

            var result = await assetTransfer.Accept({ from: owner });
            var state = await assetTransfer.State();

            assert.equal(8, state);
            truffleAssert.eventEmitted(result, 'ContractUpdated', (ev) => {
                return ev.action == 'Accept';
            }, 'Contract should return the correct message');
        });
    });
});
