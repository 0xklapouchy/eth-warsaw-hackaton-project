// SPDX-License-Identifier: GLP-3.0

pragma solidity 0.8.15;

interface IBet {
    function initAndTake(
        address taker,
        bytes32 takeParams,
        uint256 volume,
        bytes calldata details
    ) external returns (uint256 makerBetAmount, uint256 takerBetAmount);

    function take(
        address taker,
        bytes32 takeParams,
        uint256 volume,
        bytes calldata details
    ) external returns (uint256 makerBetAmount, uint256 takerBetAmount);
}
