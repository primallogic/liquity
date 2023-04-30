// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/ILQTYData.sol";
import "../Dependencies/SafeMath.sol";

contract LQTYData is ILQTYData {
    using SafeMath for uint256;

    uint internal immutable deploymentStartTime;
    uint internal immutable lpRewardsEntitlement;

    // uint for use with SafeMath
    uint internal _1_MILLION = 1e24;    // 1e6 * 1e18 = 1e24

    constructor() public {
        deploymentStartTime  = block.timestamp;
        lpRewardsEntitlement = _1_MILLION.mul(4).div(3);  // Allocate 1.33 million for LP rewards
    }

    function getDeploymentStartTime() external view override returns (uint256) {
        return deploymentStartTime;
    }

    function getLpRewardsEntitlement() external view override returns (uint256) {
        return lpRewardsEntitlement;
    }
}