// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

library Offer {
    using Offer for Data;

    struct Data {
        uint256 volume;
        uint256 nonce;
        uint256 deadline;
        bytes details;
    }

    function hashVal(bytes memory details, address maker) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(maker, details));
    }

    function fullTypeHash() internal pure returns (bytes32) {
        return keccak256("Offer(uint256 volume,uint256 nonce,uint256 deadline)");
    }
}
