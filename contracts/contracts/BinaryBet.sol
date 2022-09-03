// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./libraries/Bet.sol";
import "./libraries/Constants.sol";

contract BinaryBet {
    struct Take {
        uint256 amount;
        uint256 end;
    }

    address public maker;

    uint256 public lastEnd;
    uint256 public issued;
    uint256 public volume;
    string public symbol;

    Bet.Details public details;

    mapping(uint256 => Take) public takes;

    address public immutable hackabetInstance;

    event Claim();
    event Exercise(uint256 id);

    modifier onlyHackabet() {
        require(msg.sender == hackabetInstance, "only hackabet");
        _;
    }

    modifier onlyMaker() {
        require(msg.sender == maker, "only maker");
        _;
    }

    constructor(address _hackabetInstance) {
        require(_hackabetInstance != address(0), "hackabet invalid");
        hackabetInstance = _hackabetInstance;
        lastEnd = type(uint128).max;
    }

    function initAndTake(
        address maker_,
        address taker,
        uint256 amount,
        uint256 volume_,
        string memory symbol_,
        bytes calldata detailsPacked
    ) external returns (uint256 id) {
        require(lastEnd == 0, "already initialized");
        maker = maker_;
        volume = volume_;
        symbol = symbol_;
        details = Bet.unpackBetDetails(detailsPacked);

        return take(taker, amount);
    }

    function take(address taker, uint256 amount) public onlyHackabet returns (uint256 id) {
        require(issued + amount <= volume, "volume not available");

        issued += amount;
        uint256 end = lastEnd = block.timestamp + details.period;
        id = takeId(taker, block.number);

        takes[id] = Take({ amount: takes[id].amount + amount, end: end });

        return id;
    }

    function claim() external onlyMaker {
        require(block.timestamp > lastEnd, "not expired");

        uint256 balance = IERC20(Constants.USDC).balanceOf(address(this));
        require(balance > 0, "nothing to claim");

        emit Claim();

        IERC20(Constants.USDC).transfer(maker, balance);
    }

    function exercise(uint256 id) external {
        (uint256 amount, uint256 end) = (takes[id].amount, takes[id].end);

        require(end - details.window < block.timestamp, "too soon to exercise");
        require(amount > 0, "amount is 0");
        require(block.timestamp <= end, "contract expired");

        if (details.up) {
            require(12 >= details.price, "Price not passed");
        } else {
            require(12 <= details.price, "Price not passed");
        }

        takes[id].amount = 0;
        takes[id].end = 0;

        emit Exercise(id);

        IERC20(Constants.USDC).transfer(addressFromId(id), amount);
    }

    function takeId(address taker, uint256 blockNumber) public pure returns (uint256) {
        require(blockNumber < (1 << 64), "blockNumber too high");
        return (uint256(uint160(taker)) << 64) | blockNumber;
    }

    function addressFromId(uint256 id) internal pure returns (address) {
        return address(uint160(id >> 64));
    }
}
