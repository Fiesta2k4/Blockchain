
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("TokenSale Pricing Tests", function () {
  let token, sale, owner, buyer1;
  let units, firstLimit, maxLimit;

  beforeEach(async function () {
    [owner, buyer1] = await ethers.getSigners();

    // Deploy token 100 tokens
    const Token = await ethers.getContractFactory("Group12Token");
    token = await Token.deploy(ethers.utils.parseUnits("100", 18));
    await token.deployed();

    // Deploy sale & fund 50 tokens
    const Sale = await ethers.getContractFactory("TokenSale");
    sale = await Sale.deploy(token.address);
    await sale.deployed();
    await token.transfer(sale.address, ethers.utils.parseUnits("50", 18));

    // Calculate units and tranche limits
    units = ethers.BigNumber.from("10").pow(await token.decimals());
    const totalSupply = await token.totalSupply();
    firstLimit = totalSupply.mul(25).div(100);
    maxLimit = totalSupply.mul(50).div(100);
  });

  function getCost(tokensSold, amount) {
    // Helper to calculate cost based on contract logic
    const PRICE1 = ethers.utils.parseEther("5");
    const PRICE2 = ethers.utils.parseEther("10");
    let cost = ethers.BigNumber.from(0);
    let remaining = amount;
    let sold = tokensSold;

    // First tranche
    if (sold.lt(firstLimit)) {
      const trancheAvailable = firstLimit.sub(sold);
      const buyInTranche = remaining.gt(trancheAvailable) ? trancheAvailable : remaining;
      cost = cost.add(PRICE1.mul(buyInTranche).div(units));
      remaining = remaining.sub(buyInTranche);
      sold = sold.add(buyInTranche);
    }
    // Second tranche
    if (remaining.gt(0)) {
      cost = cost.add(PRICE2.mul(remaining).div(units));
    }
    return cost;
  }

  it("Mua 25 tokens (25%) với giá 5 ETH/token", async function () {
    const amount1 = ethers.utils.parseUnits("25", 18);
    const cost1 = getCost(ethers.BigNumber.from(0), amount1);

    await sale.connect(buyer1).buy(amount1, { value: cost1 });

    expect((await sale.tokensSold()).toString()).to.equal(amount1.toString());
    expect(
      (await token.balanceOf(buyer1.address)).toString()
    ).to.equal(amount1.toString());
  });

  it("Mua thêm 10 tokens với giá 10 ETH/token", async function () {
    // Mua 25 tokens đầu tiên ở tranche 1 (5 ETH/token)
    const amount1 = ethers.utils.parseUnits("25", 18);
    const cost1 = getCost(ethers.BigNumber.from(0), amount1);
    await sale.connect(buyer1).buy(amount1, { value: cost1 });

    // Bây giờ giá là 10 ETH/token cho 10 token tiếp theo
    const amount2 = ethers.utils.parseUnits("10", 18);
    const cost2 = getCost(amount1, amount2);
    await sale.connect(buyer1).buy(amount2, { value: cost2 });

    // Tổng tokensSold = 25 + 10 = 35
    const total = amount1.add(amount2);
    expect((await sale.tokensSold()).toString()).to.equal(total.toString());
    expect(
      (await token.balanceOf(buyer1.address)).toString()
    ).to.equal(total.toString());
  });


it("Mua 25 token ở tranche 1 và 5 token ở tranche 2 trong 2 giao dịch", async function () {
  // Mua 25 token đầu giá 5 ETH
  const amount1 = ethers.utils.parseUnits("25", 18);
  const cost1 = getCost(ethers.BigNumber.from(0), amount1);
  await sale.connect(buyer1).buy(amount1, { value: cost1 });

  // Mua tiếp 5 token giá 10 ETH
  const amount2 = ethers.utils.parseUnits("5", 18);
  const cost2 = getCost(amount1, amount2);
  await sale.connect(buyer1).buy(amount2, { value: cost2 });

  const total = amount1.add(amount2);
  expect((await sale.tokensSold()).toString()).to.equal(total.toString());
  expect(
    (await token.balanceOf(buyer1.address)).toString()
  ).to.equal(total.toString());
});

  it("Không thể mua vượt 50% supply", async function () {
    // Bán đúng 50 = 25@5 + 25@10
    const amount1 = ethers.utils.parseUnits("25", 18);
    const amount2 = ethers.utils.parseUnits("25", 18);
    const cost1 = getCost(ethers.BigNumber.from(0), amount1);
    const cost2 = getCost(amount1, amount2);

    await sale.connect(buyer1).buy(amount1, { value: cost1 });
    await sale.connect(buyer1).buy(amount2, { value: cost2 });

    // Giờ cố mua thêm 1 token => phải revert
    let reverted = false;
    try {
      const amount3 = ethers.utils.parseUnits("1", 18);
      const cost3 = getCost(amount1.add(amount2), amount3);
      await sale.connect(buyer1).buy(amount3, { value: cost3 });
    } catch (err) {
      reverted = true;
      expect(err.message).to.include("Exceeds max sale");
    }
    expect(reverted).to.be.true;
  });


});