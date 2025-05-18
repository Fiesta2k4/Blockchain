// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title 
contract Group12Token is ERC20 {
    /// @param initialSupply total minted at deploy, in “whole tokens” (multiplied by 1e18)
    constructor(uint256 initialSupply) ERC20("Group12Token", "G12") {
        _mint(msg.sender, initialSupply);
    }
}
