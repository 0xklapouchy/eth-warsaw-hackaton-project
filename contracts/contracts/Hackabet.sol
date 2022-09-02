// SPDX-License-Identifier: GLP-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Hackabet contract
/// @notice
contract Hackabet is Ownable, EIP712 {
    struct User {
        uint256 availableUSD;
        uint256 revokeNonce;
    }

    mapping(address => User) public users;

    // solhint-disable-next-line no-empty-blocks
    constructor() EIP712("Hackabet", "1") {}
}
