const Web3 = require("web3");
const dotenv = require("dotenv");
const  { contractAbi, contractAddress } = require("./config/index.js")
const { ethers } =  require('ethers');

dotenv.config();

var options = {
  timeout: 30000,
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  },
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 15,
    onTimeout: false,
  },
};

const currentWeb3 = new Web3(
  new Web3.providers.HttpProvider("")
);
const currentWeb3Socket = new Web3(
  new Web3.providers.WebsocketProvider(""),
  options
);

const contractInstance = new currentWeb3.eth.Contract(
  contractAbi,
  contractAddress
);

const getWhiteListEvent = async () => {
  const eventTopics = {
    address: [contractAddress],
    topics: [currentWeb3.utils.sha3("Transfer(address,address,uint256)")],
  };

  const eventSubscribe = await currentWeb3Socket.eth.subscribe(
    "logs",
    eventTopics
  );
  eventSubscribe.on("error", (err) => {
    throw err;
  });
  eventSubscribe.on("connected", (nr) =>
    console.log("Subscription on Payments started", nr)
  );
  eventSubscribe.on("data", (event) => {
    try {
      let user = currentWeb3.eth.abi.decodeParameters(
        ["address"],
        event.topics[1]
      );
      let to = currentWeb3.eth.abi.decodeParameters(
        ["address"],
        event.topics[2]
      );
      let data = currentWeb3.eth.abi.decodeParameters(["uint256"], event.data);
      const hash = `https://etherscan.io/tx/${event.transactionHash}`;
      console.log((data[0]/10**6))
      const result = {
        eventName: "Transfer",
        From: user[0],
        To: to[0],
        amount: data[0],
        transactionHash: hash,
        blockNumber: event.blockNumber,
      };

      console.log("result", result);
    } catch (e) {
      console.log("error", e);
    }
  });
};

(async () => {
  await getWhiteListEvent();
})();
