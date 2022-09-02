// SPDX-License-Identifier: GLP-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./libraries/Constants.sol";
import "./libraries/Offer.sol";
/// @title Hackabet contract
/// @notice
contract Hackabet is Ownable, EIP712 {
    using ECDSA for bytes32;

    struct User {
        uint256 availableUSD;
        uint256 revokeNonce;
    }

    mapping(address => User) public users;

    address public betImplementation;

    // solhint-disable-next-line no-empty-blocks
    constructor() EIP712("Hackabet", "1") {}

    function deposit(uint256 amount) external {
        User storage user = users[msg.sender];
        user.availableUSD += amount;

        IERC20(Constants.USDC).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external {
        User storage user = users[msg.sender];

        require(user.availableUSD >= amount, "Nope");

        user.availableUSD -= amount;

        IERC20(Constants.USDC).transfer(msg.sender, amount);
    }

    function revoke(uint256 newRevokeNonce) external {
        User storage user = users[msg.sender];

        require(user.revokeNonce < newRevokeNonce, "To low revoke nonce");

        user.revokeNonce = newRevokeNonce;
    }

    function recoverMaker(Offer.Data memory offer, bytes memory signature) internal view returns (address) {
        bytes32 typeHash = Offer.fullTypeHash();
        return
            _hashTypedDataV4(keccak256(abi.encode(typeHash, offer.volume, offer.nonce, offer.deadline))).recover(
                signature
            );
    }

    function contractFromOfferHash(bytes32 hashVal) public view returns (address) {
        address contr = Clones.predictDeterministicAddress(betImplementation, hashVal);

        if (Address.isContract(contr)) {
            return contr;
        }

        return address(0);
    }
}
