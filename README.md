## Overview
NFT auction is a dapp that support onchain nft mint and store NFT onchain. Users also can create auctions diretcly after mint their own NFT successfully.
It's also support multiple users create auctions, start bid at the same time and also support standard ERC20 token as trade token.

## Installation

```bash
https://github.com/yuliyu123/nft-auction.git
cd nft-auction
yarn install
```

## Run tests & deploy
```bash
yarn build
yarn test
yarn coverage
yarn deploy
```

## Coverage
```bash
------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 contracts/       |    91.49 |    54.55 |    94.74 |    91.49 |                |
  NFTAuction.sol  |     87.5 |       56 |       90 |     87.5 |... 173,177,179 |
  OnChainNFT.sol  |      100 |       50 |      100 |      100 |                |
 contracts/Mocks/ |      100 |      100 |      100 |      100 |                |
  MockERC20.sol   |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|
All files         |    91.58 |    54.55 |       95 |    91.58 |                |
------------------|----------|----------|----------|----------|----------------|
```

## MIT License
Copyright 2022 pks <<looperx95@gmail.com>>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
