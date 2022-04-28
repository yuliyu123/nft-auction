import { ethers } from "hardhat";
import { OnChainNFT__factory, NFTAuction__factory } from '../typechain';

async function main() {
  const [deployer] = await ethers.getSigners();
  const onChainNFT = await new OnChainNFT__factory(deployer).deploy();
  const nftAuction = await new NFTAuction__factory(deployer).deploy();

  console.log("onChainNFT deployed to:", onChainNFT.address);
  console.log("nftAuction deployed to:", nftAuction.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
