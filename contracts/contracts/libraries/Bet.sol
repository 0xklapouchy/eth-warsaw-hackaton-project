// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

library Bet {
    struct Details {
        bool up;
        uint32 price;
        uint32 period;
        uint32 window;
    }

    function unpackBetDetails(bytes calldata details) internal pure returns (Details memory out) {
        require(details.length == 13, "Invalid details length");
        bytes1 upEnc = details[0];
        require((upEnc == 0) || (upEnc == bytes1(uint8(1))), "Invalid bool encoding");
        out.up = bool(upEnc == bytes1(uint8(1)));

        // solhint-disable no-inline-assembly
        assembly {
            calldatacopy(add(out, sub(0x40, 4)), add(details.offset, 1), 4) // price
            calldatacopy(add(out, sub(0x60, 4)), add(details.offset, 5), 4) // period
            calldatacopy(add(out, sub(0x80, 4)), add(details.offset, 9), 4) // window
        }
    }

    function packBinaryBetDetails(Details memory details) internal pure returns (bytes memory) {
        return abi.encodePacked(details.up, details.price, details.period, details.window);
    }
}
