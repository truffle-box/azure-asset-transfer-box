const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ctconsort: {
      network_id: "*",
      gas: 0,
      gasPrice: 0,
      provider: new HDWalletProvider(fs.readFileSync('c:\\Users\\caleteet\\Downloads\\coreabs.env', 'utf-8'), "https://ctmember1.blockchain.azure.com:3200/fBhCnIgrvWpzxg1sJqSSo3pG"),
      consortium_id: 1566440437029
    }
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.5.0"
    }
  }
};
