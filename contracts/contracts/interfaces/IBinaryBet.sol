// SPDX-License-Identifier: GLP-3.0

pragma solidity 0.8.15;

interface IBinaryBet {
    function initAndTake(
        address taker,
        uint256 amount,
        uint256 volume,
        bytes calldata detailsPacked
    ) external;

    function take(
        address taker,
        uint256 amount,
        uint256 volume,
        bytes calldata detailsPacked
    ) external;
}
