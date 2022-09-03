// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

interface IBinaryBet {
    function initAndTake(
        address maker,
        address taker,
        uint256 amount,
        uint256 volume,
        string memory symbol,
        bytes calldata detailsPacked
    ) external returns (uint256 id);

    function take(address taker, uint256 amount) external returns (uint256 id);
}
