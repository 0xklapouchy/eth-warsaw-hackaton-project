// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./libraries/Constants.sol";
import "./libraries/Offer.sol";

import "./interfaces/IBinaryBet.sol";

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

    event BalanceChanged(address indexed maker, uint256 amount);
    event Revoked(address indexed maker, uint256 newRevokeNonce);
    event BetTaken(address indexed maker, address indexed taker, uint256 amount, bytes details);

    // solhint-disable-next-line no-empty-blocks
    constructor() EIP712("Hackabet", "1") {}

    function deposit(uint256 amount) external {
        User storage user = users[msg.sender];
        user.availableUSD += amount;

        emit BalanceChanged(msg.sender, user.availableUSD);

        IERC20(Constants.USDC).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external {
        User storage user = users[msg.sender];

        require(user.availableUSD >= amount, "Nope");

        user.availableUSD -= amount;

        emit BalanceChanged(msg.sender, user.availableUSD);

        IERC20(Constants.USDC).transfer(msg.sender, amount);
    }

    function revoke(uint256 newRevokeNonce) external {
        User storage user = users[msg.sender];

        require(user.revokeNonce < newRevokeNonce, "To low revoke nonce");

        user.revokeNonce = newRevokeNonce;

        emit Revoked(msg.sender, newRevokeNonce);
    }

    function takeOffer(
        Offer.Data memory offer,
        uint256 amount,
        bytes memory signature
    ) external returns (address contr) {
        address maker = recoverMaker(offer, signature);
        address taker = msg.sender;

        require(offer.nonce > users[maker].revokeNonce, "offer revoked");
        require(offer.deadline > block.timestamp, "offer expired");

        bytes32 hashVal = Offer.hashVal(offer.details, maker);

        contr = contractFromOfferHash(hashVal);

        uint256 id;

        if (contr == address(0)) {
            (contr, id) = createAndTake(hashVal, offer, maker, taker, amount);
        } else {
            id = IBinaryBet(contr).take(taker, amount);
        }

        require(amount <= users[maker].availableUSD, "collateral not available");
        unchecked {
            users[maker].availableUSD -= amount;
        }

        emit BalanceChanged(maker, users[maker].availableUSD);
        emit BetTaken(maker, taker, amount, offer.details);

        IERC20(Constants.USDC).transferFrom(taker, contr, amount);
        IERC20(Constants.USDC).transfer(contr, amount);
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

    function createAndTake(
        bytes32 hashVal,
        Offer.Data memory offer,
        address maker,
        address taker,
        uint256 amount
    ) internal returns (address, uint256) {
        address newContr = Clones.cloneDeterministic(betImplementation, hashVal);
        uint256 id = IBinaryBet(newContr).initAndTake(maker, taker, amount, offer.volume, offer.details);

        return (newContr, id);
    }
}
