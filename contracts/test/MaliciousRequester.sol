// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../AgentEscrow.sol";

/// Test-only helper: attempts to reenter cancelOpenBounty() during its own payout.
/// Not part of the deployed product, used solely by the Hardhat test suite.
contract MaliciousRequester {
    AgentEscrow public immutable escrow;
    uint256 public bountyId;
    bool public reentered;

    constructor(address escrowAddress) {
        escrow = AgentEscrow(escrowAddress);
    }

    function createAndCancel(
        address agent,
        string calldata description,
        uint256 workDuration,
        uint256 reviewPeriod
    ) external payable {
        bountyId = escrow.createBounty{value: msg.value}(agent, description, workDuration, reviewPeriod);
        escrow.cancelOpenBounty(bountyId);
    }

    receive() external payable {
        if (!reentered) {
            reentered = true;
            escrow.cancelOpenBounty(bountyId);
        }
    }
}
