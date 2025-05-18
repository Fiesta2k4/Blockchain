// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    ERC20 public token;
    uint256 public tokensSold;
    uint256 public saleStart;
    uint256 public constant DURATION = 30 days;
    uint256 public constant PCT_FIRST = 25;
    uint256 public constant PCT_MAX   = 50;
    uint256 public constant PRICE1    = 5 ether;
    uint256 public constant PRICE2    = 10 ether;
    uint256 public immutable totalSupply;
    uint256 public immutable firstLimit;
    uint256 public immutable maxLimit;
    uint8   public immutable tokenDecimals;

    constructor(address tokenAddress) Ownable(msg.sender) {
        token         = ERC20(tokenAddress);
        saleStart     = block.timestamp;
        totalSupply   = token.totalSupply();
        firstLimit    = (totalSupply * PCT_FIRST) / 100;
        maxLimit      = (totalSupply * PCT_MAX)   / 100;
        tokenDecimals = token.decimals();
    }

    function buy(uint256 amount) external payable {
        require(block.timestamp <= saleStart + DURATION, "Sale ended");
        require(tokensSold + amount <= maxLimit,      "Exceeds max sale");

        uint256 units = 10 ** tokenDecimals;
        uint256 cost;
        if (tokensSold + amount <= firstLimit) {
            cost = (PRICE1 * amount) / units;
        } else {
            require(tokensSold >= firstLimit, "Must buy within tranche");
            cost = (PRICE2 * amount) / units;
        }
        require(msg.value == cost, "Incorrect ETH sent");

        tokensSold += amount;
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    function endSale() external onlyOwner {
        require(
            block.timestamp > saleStart + DURATION || tokensSold >= maxLimit,
            "Sale still active"
        );
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) token.transfer(owner(), bal);
        payable(owner()).transfer(address(this).balance);
    }
}
