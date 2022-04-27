const { assert } = require("chai");
const { ethers } = require("hardhat");
import { formatUnits } from "ethers/lib/utils";
import { OnChainNFT__factory, NFTAuction__factory, MockERC20__factory } from '../typechain/';
import { OnChainNFT } from '../typechain/OnChainNFT';
import { NFTAuction } from '../typechain/NFTAuction';
import { MockERC20 } from '../typechain/MockERC20';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// var Web3 = require("web3");
// var web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8545");

const traveler = require("ganache-time-traveler");
const TEST_TRAVEL_TIME = 3600 * 2; // 2 hours

let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress,
  frank: SignerWithAddress, tom: SignerWithAddress, accounts: SignerWithAddress[];;
let onChainNFT: OnChainNFT;
let nftAuction: NFTAuction;
let mockToken: MockERC20;

before(async function () {
  accounts = (await ethers.getSigners()).slice(0, 5);;
  [deployer, alice, bob, frank, tom] = accounts;
  onChainNFT = await new OnChainNFT__factory(deployer).deploy();
  mockToken = await new MockERC20__factory(deployer).deploy();
  nftAuction = await new NFTAuction__factory(deployer).deploy();
});

// let advanceTimeAndBlock = async (time: any) => {
//   //capture current time
//   let block = await web3.eth.getBlock('latest')
//   let forwardTime = block['timestamp'] + time

//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send({
//       jsonrpc: '2.0',
//       method: 'evm_mine',
//       params: [forwardTime],
//       id: new Date().getTime()
//     }, (err: any, result: any) => {
//       if (err) { return reject(err) }
//       return resolve(result)
//     })
//   })
// }

describe("NFT TESTS", function () {
  it("Case #1 - should mint and transfer to alice success", async function () {
    assert.equal(0, await onChainNFT.totalSupply(), "initial total amount should eq to 0");
    const mintTx = await onChainNFT.connect(alice).mint("alice", { value: ethers.utils.parseEther("0.005") });
    await mintTx.wait();

    assert.equal(1, await onChainNFT.totalSupply(), "initial total amount should eq to 1");
    assert.equal(true, await onChainNFT.exists("alice"));

    ethers.provider.getBalance(onChainNFT.address);
    assert.equal(0.005, await formatUnits(await ethers.provider.getBalance(onChainNFT.address), 18));
  });

  it("Case #2 - should generate an image to alice ", async function () {
    assert.equal(0.005, await formatUnits(await ethers.provider.getBalance(onChainNFT.address), 18));
    console.log("build meta data:", await onChainNFT.tokenURI(1));
  });

  it("Case #3 - should withdrawal to deployer success", async function () {
    console.log("initial deployer balance: ", await formatUnits(await ethers.provider.getBalance(deployer.address), 18));

    await onChainNFT.withdraw();
    assert.equal(0, await formatUnits(await ethers.provider.getBalance(onChainNFT.address), 18));

    console.log("after withdrawal, deployer balance: ", await formatUnits(await ethers.provider.getBalance(deployer.address), 18));
  });

  it("Case #4 - tom should be the auction winner", async function () {
    const nftAddress = onChainNFT.address;
    const duration = await (await ethers.provider.getBlock(1)).timestamp + TEST_TRAVEL_TIME;

    assert.equal(alice.address, await nftAuction.ownof(onChainNFT.address, 1));

    for (let i = 0; i < accounts.length; ++i) {
      await mockToken.transfer(accounts[i].address, 10000);
      await mockToken.connect(accounts[i]).approve(nftAuction.address, 1000);
    }

    // approve & create auction
    await onChainNFT.connect(alice).approve(nftAuction.address, 1);
    await nftAuction.connect(alice).createTokenAuction(nftAddress, 1, mockToken.address, 1, duration);

    // start bid
    await nftAuction.connect(bob).bid(nftAddress, 1, 2);
    await nftAuction.connect(frank).bid(nftAddress, 1, 3);
    await nftAuction.connect(bob).bid(nftAddress, 1, 4);
    await nftAuction.connect(tom).bid(nftAddress, 1, 5);
    await nftAuction.connect(frank).bid(nftAddress, 1, 19);
    await nftAuction.connect(bob).bid(nftAddress, 1, 19);
    await nftAuction.connect(bob).bid(nftAddress, 1, 100);
    await nftAuction.connect(tom).bid(nftAddress, 1, 200);

    const auctionDetail = await nftAuction.getTokenAuctionDetails(nftAddress, 1);
    assert.equal(tom.address, await auctionDetail.maxBidUser);
    assert.equal(nftAuction.address, await nftAuction.ownof(onChainNFT.address, 1));
  });

  it("Case #5 - stop and resume auction", async function () {
    await nftAuction.connect(alice).stopAuction(onChainNFT.address, 1);

    let auctionDetail = await nftAuction.getTokenAuctionDetails(onChainNFT.address, 1);
    assert.equal(false, await auctionDetail.isActive);

    await nftAuction.connect(alice).resumeAuction(onChainNFT.address, 1);
    auctionDetail = await nftAuction.getTokenAuctionDetails(onChainNFT.address, 1);
    assert.equal(true, await auctionDetail.isActive);
  });

  it("Case #6 - auction success", async function () {
    console.log("nftAuction.address: ", nftAuction.address);
    console.log("onChainNFT.address: ", onChainNFT.address);
    assert.equal(nftAuction.address, await nftAuction.ownof(onChainNFT.address, 1));

    // console.log("go forward in time");
    // await traveler.advanceTimeAndBlock(TEST_TRAVEL_TIME);

    // await nftAuction.connect(alice).finishSale(onChainNFT.address, 1);
    // assert.equal(tom.address, await nftAuction.ownof(onChainNFT.address, 1));

    // for (let i = 0; i < accounts.length; ++i) {
    //   assert.equal(1000, await mockToken.balanceOf(accounts[i].address));
    // }
  });
});
