const { assert } = require("chai");
const { ethers } = require("hardhat");
import { formatUnits } from "ethers/lib/utils";
import { OnChainNFT__factory, NFTAuction__factory, MockERC20__factory } from '../typechain/';
import { OnChainNFT } from '../typechain/OnChainNFT';
import { NFTAuction } from '../typechain/NFTAuction';
import { MockERC20 } from '../typechain/MockERC20';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const TEST_TRAVEL_TIME = 3600 * 2; // 2 hours

let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress,
  frank: SignerWithAddress, tom: SignerWithAddress, accounts: SignerWithAddress[];
let onChainNFT: OnChainNFT;
let nftAuction: NFTAuction;
let mockToken: MockERC20;
let tokenId: number;

before(async function () {
  accounts = (await ethers.getSigners()).slice(0, 5);;
  [deployer, alice, bob, frank, tom] = accounts;
  onChainNFT = await new OnChainNFT__factory(deployer).deploy();
  mockToken = await new MockERC20__factory(deployer).deploy();
  nftAuction = await new NFTAuction__factory(deployer).deploy();
});

const advanceTimeAndBlock = (async function (time: number) {
  let block = await ethers.provider.getBlock('latest');
  await ethers.provider.send("evm_mine", [block['timestamp'] + time]);
});

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
    const duration = await (await ethers.provider.getBlock(('latest'))).timestamp + TEST_TRAVEL_TIME;

    assert.equal(alice.address, await nftAuction.ownof(onChainNFT.address, 1));

    for (let i = 0; i < accounts.length; ++i) {
      await mockToken.transfer(accounts[i].address, 10000);
      await mockToken.connect(accounts[i]).approve(nftAuction.address, 1000);
    }

    let tokenIds = await onChainNFT.connect(alice).getUserTokenIds();
    tokenId = tokenIds[0].toNumber();

    // approve & create auction
    await onChainNFT.connect(alice).approve(nftAuction.address, tokenId);
    await nftAuction.connect(alice).createTokenAuction(nftAddress, tokenId, mockToken.address, 1, duration);

    // start bid
    await nftAuction.connect(bob).bid(nftAddress, tokenId, 2);
    await nftAuction.connect(frank).bid(nftAddress, tokenId, 3);
    await nftAuction.connect(bob).bid(nftAddress, tokenId, 4);
    await nftAuction.connect(tom).bid(nftAddress, tokenId, 5);
    await nftAuction.connect(frank).bid(nftAddress, tokenId, 19);
    await nftAuction.connect(bob).bid(nftAddress, tokenId, 19);
    await nftAuction.connect(bob).bid(nftAddress, tokenId, 100);
    await nftAuction.connect(tom).bid(nftAddress, tokenId, 200);

    const auctionDetail = await nftAuction.getTokenAuctionDetails(nftAddress, tokenId);
    assert.equal(tom.address, await auctionDetail.maxBidUser);
    assert.equal(nftAuction.address, await nftAuction.ownof(onChainNFT.address, tokenId));
  });

  it("Case #5 - stop and resume auction", async function () {
    await nftAuction.connect(alice).stopAuction(onChainNFT.address, tokenId);

    let auctionDetail = await nftAuction.getTokenAuctionDetails(onChainNFT.address, tokenId);
    assert.equal(false, await auctionDetail.isActive);

    await nftAuction.connect(alice).resumeAuction(onChainNFT.address, tokenId);
    auctionDetail = await nftAuction.getTokenAuctionDetails(onChainNFT.address, tokenId);
    assert.equal(true, await auctionDetail.isActive);
  });

  it("Case #6 - auction success", async function () {
    assert.equal(nftAuction.address, await nftAuction.ownof(onChainNFT.address, tokenId));
    assert.equal(10000, await mockToken.balanceOf(alice.address));
    assert.equal(9900, await mockToken.balanceOf(bob.address));
    assert.equal(9981, await mockToken.balanceOf(frank.address));
    assert.equal(9800, await mockToken.balanceOf(tom.address));

    console.log("go forward in time");
    await advanceTimeAndBlock(TEST_TRAVEL_TIME);
    await nftAuction.connect(alice).finishSale(onChainNFT.address, 1);

    assert.equal(tom.address, await nftAuction.ownof(onChainNFT.address, 1));
    assert.equal(10200, await mockToken.balanceOf(alice.address));
    assert.equal(10000, await mockToken.balanceOf(bob.address));
    assert.equal(10000, await mockToken.balanceOf(frank.address));
    assert.equal(9800, await mockToken.balanceOf(tom.address));
  });
});
