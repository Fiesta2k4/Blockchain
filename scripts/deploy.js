const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1) Deploy token với supply = 1000 token (decimals = 18)
  const initialSupply = ethers.utils.parseUnits("1000", 18);
  const Token = await ethers.getContractFactory("Group12Token");
  const token = await Token.deploy(initialSupply);
  await token.deployed();
  console.log("Token deployed at:", token.address);

  // 2) Deploy sale contract
  const Sale = await ethers.getContractFactory("TokenSale");
  const sale = await Sale.deploy(token.address);
  await sale.deployed();
  console.log("Sale deployed at:", sale.address);

  // 3) Chuyển 50% supply vào sale contract
  const maxSale = initialSupply.mul(50).div(100);
  await token.transfer(sale.address, maxSale);
  console.log(
    "Transferred",
    ethers.utils.formatUnits(maxSale, 18),
    "tokens to sale"
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
