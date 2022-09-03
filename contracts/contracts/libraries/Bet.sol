// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

library Bet {
    struct Details {
        bool up;
        uint256 price;
        uint256 period;
        uint256 window;
    }

    function unpackBetDetails(bytes calldata details) internal pure returns (Details memory out) {
        require(details.length == 128, "Invalid details length");
        // solhint-disable no-inline-assembly
        assembly {
            calldatacopy(add(out, sub(0x20, 32)), details.offset, 32)
            calldatacopy(add(out, sub(0x40, 32)), add(details.offset, 32), 32)
            calldatacopy(add(out, sub(0x60, 32)), add(details.offset, 64), 32)
            calldatacopy(add(out, sub(0x80, 32)), add(details.offset, 96), 32)
        }
    }

    function packBinaryBetDetails(Details memory details) internal pure returns (bytes memory) {
        return abi.encodePacked(details.up, details.price, details.period, details.window);
    }
}
