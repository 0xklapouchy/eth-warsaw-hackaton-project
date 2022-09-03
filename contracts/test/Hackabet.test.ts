import { waffle, ethers } from "hardhat";
import { expect } from "chai";

import HackabetArtifacts from "../artifacts/contracts/Hackabet.sol/Hackabet.json";
import BinaryBetArtifacts from "../artifacts/contracts/BinaryBet.sol/BinaryBet.json";
import ERC20MockArtifact from "../artifacts/contracts/mocks/ERC20Mock.sol/ERC20Mock.json";
import { Hackabet, BinaryBet, ERC20Mock } from "../typechain";

import { Wallet, utils, BigNumber, BytesLike, tuple } from "ethers";
import { getBigNumber, duration, ADDRESS_ZERO, latest, increase } from "./utilities";
const { provider, deployContract } = waffle;

import { EIP712Domain, domainSeparator } from "./utilities/epi712";
import { toBuffer } from "ethereumjs-util";
import { signTypedData_v4 } from "eth-sig-util";
import { isBytes } from "ethers/lib/utils";

const OFFER_TYPEHASH = utils.id("Offer(uint256 volume,uint256 nonce,uint256 deadline)");

const Offer = [
  { name: "volume", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
];

describe("Hackabet", () => {
  let sut: Hackabet;
  let bet: BinaryBet;
  let usdc: ERC20Mock;

  const [deployer, maker, taker] = provider.getWallets() as Wallet[];

  let chainId: number;

  const name = "Hackabet";
  const version = "1";

  async function makeSUT(): Promise<Hackabet> {
    return (await deployContract(deployer, HackabetArtifacts, [])) as Hackabet;
  }

  before(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId;
  });

  beforeEach(async () => {
    sut = await makeSUT();
    bet = (await deployContract(deployer, BinaryBetArtifacts, [sut.address])) as BinaryBet;
    usdc = (await deployContract(deployer, ERC20MockArtifact, [
      "USDC",
      "USDC",
      6,
      getBigNumber(1000000, 6),
    ])) as ERC20Mock;

    await sut.init(bet.address, usdc.address);

    await await usdc.transfer(maker.address, getBigNumber(10000, 6));
    await usdc.transfer(taker.address, getBigNumber(10000, 6));
  });

  describe("constructor ", () => {
    it("should initialize as expected", async function () {
      expect(await sut.owner()).to.be.equal(deployer.address);
    });
  });

  describe("deposit", () => {
    it("should add deposit as expected", async function () {
      const amount = getBigNumber(500, 6);
      await usdc.connect(maker).approve(sut.address, amount.mul(2));

      await expect(sut.connect(maker).deposit(amount)).to.emit(sut, "BalanceChanged").withArgs(maker.address, amount);
      await expect(sut.connect(maker).deposit(amount))
        .to.emit(sut, "BalanceChanged")
        .withArgs(maker.address, amount.mul(2));
    });

    it("should revert with zero amount", async function () {
      await expect(sut.connect(maker).deposit(0)).to.be.revertedWith("zero amount");
    });
  });

  describe("withdraw", () => {
    it("should withdraw as expected", async function () {
      const amount = getBigNumber(500, 6);
      await usdc.connect(maker).approve(sut.address, amount.mul(2));
      await sut.connect(maker).deposit(amount.mul(2));

      await expect(sut.connect(maker).withdraw(amount)).to.emit(sut, "BalanceChanged").withArgs(maker.address, amount);
      await expect(sut.connect(maker).withdraw(amount)).to.emit(sut, "BalanceChanged").withArgs(maker.address, 0);
    });
  });

  describe("revoke", () => {
    it("should revoke as expected", async function () {
      await expect(sut.connect(maker).revoke(2)).to.emit(sut, "Revoked").withArgs(maker.address, 2);
      await expect(sut.connect(maker).revoke(1)).to.be.revertedWith("to low revoke nonce");
    });
  });

  describe("recoverMaker", () => {
    type OfferDataStruct = {
      volume: BigNumber;
      nonce: BigNumber;
      deadline: BigNumber;
      details: BytesLike;
    };

    const buildData = (chainId, verifyingContract, volume, nonce, deadline) => ({
      primaryType: "Offer" as const,
      types: { EIP712Domain, Offer },
      domain: { name, version, chainId, verifyingContract },
      message: { volume, nonce, deadline },
    });

    it("should recover maker as expected", async () => {
      const data = buildData(chainId, sut.address, getBigNumber(500, 6).toString(), 1, 1);
      const signature = signTypedData_v4(toBuffer(maker.privateKey), { data: data });

      const offerData: OfferDataStruct = {
        volume: getBigNumber(500, 6),
        nonce: BigNumber.from(1),
        deadline: BigNumber.from(1),
        details: utils.id("myStructData"),
      };

      expect(await sut.recoverMaker(offerData, signature)).to.be.equal(maker.address);
    });
  });

  describe("takeOffer", () => {
    type OfferDataStruct = {
      volume: BigNumber;
      nonce: BigNumber;
      deadline: BigNumber;
      details: BytesLike;
    };

    type BetDetailsStruct = {
      up: boolean;
      price: number;
      period: number;
      window: number;
    };

    const buildData = (chainId, verifyingContract, volume, nonce, deadline) => ({
      primaryType: "Offer" as const,
      types: { EIP712Domain, Offer },
      domain: { name, version, chainId, verifyingContract },
      message: { volume, nonce, deadline },
    });

    beforeEach(async () => {
      const amount = getBigNumber(500, 6);

      await usdc.connect(maker).approve(sut.address, amount.mul(2));
      await sut.connect(maker).deposit(amount.mul(2));

      await usdc.connect(taker).approve(sut.address, amount);
    });

    it("should take offer as expected", async () => {
      const now = await latest();

      const data = buildData(chainId, sut.address, getBigNumber(500, 6).toString(), 1, now.add(100).toString());
      const signature = signTypedData_v4(toBuffer(maker.privateKey), { data: data });

      const betDetails: BetDetailsStruct = {
        up: false,
        price: 160000,
        period: 60 * 60,
        window: 5 * 60,
      };

      const myStructData = ethers.utils.AbiCoder.prototype.encode(
        ["bool", "uint", "uint", "uint"],
        [betDetails.up, betDetails.price, betDetails.period, betDetails.window]
      );

      const offerData: OfferDataStruct = {
        volume: getBigNumber(500, 6),
        nonce: BigNumber.from(1),
        deadline: now.add(100).toString(),
        details: myStructData,
      };

      await expect(sut.connect(taker).takeOffer(offerData, getBigNumber(100, 6), signature))
        .to.emit(sut, "BalanceChanged")
        .withArgs(maker.address, getBigNumber(900, 6))
        .and.to.emit(sut, "BetTaken")
        .withArgs(
          maker.address,
          taker.address,
          "0xE45a04d33AFe0568fC42553aCec8C7Dc7839f278",
          "6347041891605262682829381928223060197463835116955138866526285725750",
          getBigNumber(100, 6),
          offerData.details
        );

      await expect(sut.connect(taker).takeOffer(offerData, getBigNumber(100, 6), signature))
        .to.emit(sut, "BalanceChanged")
        .withArgs(maker.address, getBigNumber(800, 6))
        .and.to.emit(sut, "BetTaken")
        .withArgs(
          maker.address,
          taker.address,
          "0xE45a04d33AFe0568fC42553aCec8C7Dc7839f278",
          "6347041891605262682829381928223060197463835116955138866526285725751",
          getBigNumber(100, 6),
          offerData.details
        );
    });
  });
});
