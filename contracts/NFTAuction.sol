// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";

contract NFTAuction is IERC721Receiver {
    
    string private name;
    constructor() {
        name = "NFT Auction";
    }

    struct auctionDetails {
        address seller;
        uint128 price;
        uint256 duration;
        address tokenAddress;
        uint256 maxBid;
        address maxBidUser;
        bool isActive;
        uint256[] bidAmounts;
        address[] users;
    }

    mapping(address => mapping(uint256 => auctionDetails))
        public tokenToAuction;
    mapping(address => mapping(uint256 => mapping(address => uint256)))
        public bids;

    function createTokenAuction(
        address _nft,
        uint256 _tokenId,
        address _tokenAddress,
        uint128 _price,
        uint256 _duration
    ) external {
        require(msg.sender != address(0), "msg.sender can't be 0x00");
        require(_nft != address(0), "msg.sender can't be 0x00");
        require(_price > 0, "price lt than 0");
        require(_duration > 0, "auction duration lt 0");

        auctionDetails memory _auction = auctionDetails({
            seller: msg.sender,
            price: uint128(_price),
            duration: _duration,
            tokenAddress: _tokenAddress,
            maxBid: 0,
            maxBidUser: address(0),
            isActive: true,
            bidAmounts: new uint256[](0),
            users: new address[](0)
        });
        address owner = msg.sender;
        IERC721(_nft).safeTransferFrom(owner, address(this), _tokenId);
        tokenToAuction[_nft][_tokenId] = _auction;
    }

    function bid(
        address _nft,
        uint256 _tokenId,
        uint256 _amount
    ) external payable {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(
            _amount >= auction.price && _amount >= auction.maxBid,
            "amount is less than current auction max bid"
        );
        require(auction.isActive, "auction is not alive");
        require(auction.duration > block.timestamp, "deadline already passed");
        require(msg.sender != address(0) && msg.sender != auction.seller, "bid user is invalid");

        bool exist = false;
        // check wheather bid, refund old user bid to user
        if (bids[_nft][_tokenId][msg.sender] > 0) {
            bool success = IERC20(auction.tokenAddress).transfer(
                msg.sender,
                bids[_nft][_tokenId][msg.sender]
            );
            require(success, "refund to bider failed.");
            exist = true;
        }

        bids[_nft][_tokenId][msg.sender] = _amount;
        IERC20(auction.tokenAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // auction.bidAmounts sort by increment.
        if (auction.bidAmounts.length == 0) {
            auction.maxBid = _amount;
            auction.maxBidUser = msg.sender;
        } else {
            uint256 lastIndex = auction.bidAmounts.length - 1;
            require(
                auction.bidAmounts[lastIndex] < _amount,
                "Current max bid is higher than your bid"
            );
            auction.maxBid = _amount;
            auction.maxBidUser = msg.sender;
        }

        if (!exist) {
            auction.users.push(msg.sender);
            auction.bidAmounts.push(_amount);
        }
    }

    function executeSale(address _nft, uint256 _tokenId) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(
            auction.duration <= block.timestamp,
            "deadline did not pass yet"
        );
        require(auction.seller == msg.sender, "msg.sender is not seller");
        require(auction.isActive, "auction is not alive now.");
        auction.isActive = false;
        if (auction.bidAmounts.length == 0) {
            IERC721(_nft).safeTransferFrom(
                address(this),
                auction.seller,
                _tokenId
            );
        } else {
            bool success = IERC20(auction.tokenAddress).transfer(
                auction.seller,
                auction.maxBid
            );
            require(success, "transfer to seller failed.");
            for (uint256 i = 0; i < auction.users.length; i++) {
                if (auction.users[i] != auction.maxBidUser) {
                    success = IERC20(auction.tokenAddress).transfer(
                        auction.users[i],
                        bids[_nft][_tokenId][auction.users[i]]
                    );
                    require(success, "transfer to bider failed.");
                }
            }
            IERC721(_nft).safeTransferFrom(
                address(this),
                auction.maxBidUser,
                _tokenId
            );
        }
    }

    function cancelAution(address _nft, uint256 _tokenId) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(auction.seller == msg.sender, "msg.sender is not seller");
        require(auction.isActive, "auction is not alive now.");
        auction.isActive = false;
        bool success;
        for (uint256 i = 0; i < auction.users.length; i++) {
            success = IERC20(auction.tokenAddress).transfer(
                auction.users[i],
                bids[_nft][_tokenId][auction.users[i]]
            );
            require(success, "refund nft to bider failed.");
        }
        IERC721(_nft).safeTransferFrom(address(this), auction.seller, _tokenId);
    }

    function getTokenAuctionDetails(address _nft, uint256 _tokenId)
        public
        view
        returns (auctionDetails memory)
    {
        auctionDetails memory auction = tokenToAuction[_nft][_tokenId];
        return auction;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) public pure override returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }
}
