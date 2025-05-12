// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenSale — triển khai sale 50% supply, 25% giá 5 ETH, sau đó giá 10 ETH, dừng sau 30 ngày
contract TokenSale is Ownable {
    IERC20 public token;
    uint256 public tokensSold;
    uint256 public saleStart;
    uint256 public constant DURATION = 30 days;

    uint256 public constant PCT_FIRST = 25;  // 25%
    uint256 public constant PCT_MAX   = 50;  // 50%
    uint256 public constant PRICE1 = 5 ether;
    uint256 public constant PRICE2 = 10 ether;

    uint256 public immutable totalSupply;   // tổng supply token
    uint256 public immutable firstLimit;    // giới hạn tranche đầu = totalSupply * 25%
    uint256 public immutable maxLimit;      // giới hạn sale = totalSupply * 50%

    /// @param tokenAddress Địa chỉ ERC20 token đã deploy trước
    constructor(address tokenAddress) Ownable(msg.sender) {
        token = IERC20(tokenAddress);
        saleStart = block.timestamp;

        totalSupply = token.totalSupply();
        firstLimit  = (totalSupply * PCT_FIRST) / 100;
        maxLimit    = (totalSupply * PCT_MAX)   / 100;
    }

    /// @notice Mua `amount` tokens, thanh toán đúng ETH
    function buy(uint256 amount) external payable {
        require(block.timestamp <= saleStart + DURATION, "Sale ended");
        require(tokensSold + amount <= maxLimit,      "Exceeds max sale");

        uint256 cost;
        // Nếu vẫn trong tranche 1 (<= 25% supply)
        if (tokensSold + amount <= firstLimit) {
            cost = PRICE1 * amount;
        } else {
            // Không cho phép order qua ranh tranche 1
            require(tokensSold >= firstLimit,
                    "Must buy within tranche");
            cost = PRICE2 * amount;
        }

        require(msg.value == cost, "Incorrect ETH sent");

        tokensSold += amount;
        require(token.transfer(msg.sender, amount),
                "Token transfer failed");
    }

    /// @notice Chủ sở hữu dừng sale (sau 30 ngày hoặc bán hết 50%), thu hồi token & ETH
    function endSale() external onlyOwner {
        require(
            block.timestamp > saleStart + DURATION
            || tokensSold >= maxLimit,
            "Sale still active"
        );

        // Trả lại token còn dư cho owner
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.transfer(owner(), bal);
        }
        // Chuyển ETH thu được về owner
        payable(owner()).transfer(address(this).balance);
    }
}
