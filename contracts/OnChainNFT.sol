// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";

contract OnChainNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;
    bool public paused = false;
    mapping(uint256 => Word) public tokenIdToWords;
    mapping(address => uint256[]) userToTokenIds;
    uint256 public stringLimit = 45;

    struct Word {
        string name;
        string description;
        string bgHue;
        string textHue;
        string value;
    }

    constructor() ERC721("onChainNFT", "OCN") {}

    function mint(string memory _userText) public payable returns (uint256) {
        uint256 newTokenId = totalSupply() + 1;
        bytes memory strBytes = bytes(_userText);
        require(strBytes.length <= stringLimit, "String input exceeds limit.");
        require(exists(_userText) != true, "String already exists!");

        Word memory newWord = Word(
            string(abi.encodePacked("NFT", uint256(newTokenId).toString())),
            "This is our on-chain NFT",
            randomNum(361, block.difficulty, totalSupply()).toString(),
            randomNum(361, block.timestamp, totalSupply()).toString(),
            _userText
        );

        if (msg.sender != owner()) {
            require(
                msg.value == 0.005 ether,
                "msg.sender value is not equal 0.005 ether"
            );
        }

        tokenIdToWords[newTokenId] = newWord;
        userToTokenIds[msg.sender].push(newTokenId);
        _safeMint(msg.sender, newTokenId);
        return newTokenId;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return buildMetadata(_tokenId);
    }

    function exists(string memory _text) public view returns (bool) {
        bool result = false;
        for (uint256 i = 1; i <= totalSupply(); i++) {
            string memory text = tokenIdToWords[i].value;
            if (
                keccak256(abi.encodePacked(text)) ==
                keccak256(abi.encodePacked(_text))
            ) {
                result = true;
            }
        }
        return result;
    }

    function randomNum(
        uint256 _mod,
        uint256 _seed,
        uint256 _salt
    ) public view returns (uint256) {
        uint256 num = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, msg.sender, _seed, _salt)
            )
        ) % _mod;
        return num;
    }

    function buildImage(uint256 _tokenId) private view returns (string memory) {
        Word memory currentWord = tokenIdToWords[_tokenId];
        string memory random = randomNum(361, 3, 3).toString();
        return
            Base64.encode(
                bytes(
                    abi.encodePacked(
                        '<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">',
                        '<rect id="svg_11" height="600" width="503" y="0" x="0" fill="hsl(',
                        currentWord.bgHue,
                        ',50%,25%)"/>',
                        '<text font-size="18" y="10%" x="5%" fill="hsl(',
                        random,
                        random,
                        random,
                        random,
                        ',100%,80%)">Token: ',
                        _tokenId.toString(),
                        "</text>",
                        '<text font-size="18" y="50%" x="50%" text-anchor="middle" fill="hsl(',
                        random,
                        ',100%,80%)">',
                        currentWord.value,
                        "</text>",
                        "</svg>"
                    )
                )
            );
    }

    function buildMetadata(uint256 _tokenId)
        private
        view
        returns (string memory)
    {
        Word memory currentWord = tokenIdToWords[_tokenId];
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                currentWord.name,
                                '", "description":"',
                                currentWord.description,
                                '", "image": "',
                                "data:image/svg+xml;base64,",
                                buildImage(_tokenId),
                                '", "attributes": ',
                                "[",
                                '{"trait_type": "TextColor",',
                                '"value":"',
                                currentWord.textHue,
                                '"}',
                                "]",
                                "}"
                            )
                        )
                    )
                )
            );
    }

    function getUserTokenIds() public view returns (uint256[] memory) {
        require(msg.sender != address(0), "user address can't be zero");
        return userToTokenIds[msg.sender];
    }

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "withdraw failed");
    }
}
