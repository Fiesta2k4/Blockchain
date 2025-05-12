const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSale Tranche Tests", function () {
  let token, sale, owner, buyer1, buyer2;
  // Dùng supply nhỏ cho test cho dễ nhìn
  const initialSupply = ethers.utils.parseUnits("100", 18); // 100 token

  beforeEach(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("Group12Token");
    token = await Token.deploy(initialSupply);
    await token.deployed();

    // Deploy sale và chuyển 50% supply vào
    const Sale = await ethers.getContractFactory("TokenSale");
    sale = await Sale.deploy(token.address);
    await sale.deployed();

    const half = initialSupply.mul(50).div(100); // 50% của 100
    await token.transfer(sale.address, half);
  });

  it("Tranche 1: mua 25% supply với giá 5 ETH/token", async function () {
    const firstLimit = initialSupply.mul(25).div(100); // 25 token
    const cost1 = ethers.utils.parseEther("5").mul(firstLimit);

    // buyer1 mua đúng 25 token
    await sale.connect(buyer1).buy(firstLimit, { value: cost1 });

    expect(await sale.tokensSold()).to.equal(firstLimit);
    expect(await token.balanceOf(buyer1.address)).to.equal(firstLimit);
  });

  it("Tranche 2: mua tiếp 10 token với giá 10 ETH/token", async function () {
    const firstLimit = initialSupply.mul(25).div(100); // 25 token
    const cost1 = ethers.utils.parseEther("5").mul(firstLimit);
    await sale.connect(buyer1).buy(firstLimit, { value: cost1 });

    // giờ mua 10 token ở tranche 2
    const amount2 = ethers.utils.parseUnits("10", 18);
    const cost2   = ethers.utils.parseEther("10").mul(amount2);
    await sale.connect(buyer2).buy(amount2, { value: cost2 });

    expect(await sale.tokensSold()).to.equal(firstLimit.add(amount2));
    expect(await token.balanceOf(buyer2.address)).to.equal(amount2);
  });

  it("Không thể mua vượt 50% supply", async function () {
    const firstLimit = initialSupply.mul(25).div(100); // 25 token
    const cost1 = ethers.utils.parseEther("5").mul(firstLimit);
    await sale.connect(buyer1).buy(firstLimit, { value: cost1 });

    // mua thêm 25 token (vượt tranche 2)
    const secondAmount = initialSupply.mul(25).div(100);
    const cost2 = ethers.utils.parseEther("10").mul(secondAmount);
    await sale.connect(buyer1).buy(secondAmount, { value: cost2 });

    // cố gắng mua thêm 1 token sẽ revert
    await expect(
      sale.connect(buyer1).buy(1, { value: ethers.utils.parseEther("10") })
    ).to.be.revertedWith("Exceeds max sale");
  });
});
