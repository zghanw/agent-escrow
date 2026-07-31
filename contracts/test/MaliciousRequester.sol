// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../AgentEscrow.sol";

/// Test-only helper: attempts to reenter refund() during its own payout.
/// Not part of the deployed product, used solely by the Hardhat test suite.
contract MaliciousRequester {
    AgentEscrow public immutable escrow;
    uint256 public bountyId;
    bool public reentered;

    constructor(address escrowAddress) {
        escrow = AgentEscrow(escrowAddress);
    }

    function createAndRefund(string calldata description) external payable {
        bountyId = escrow.createBounty{value: msg.value}(address(1), description, 1 days, 1 days);
        escrow.refund(bountyId);
    }

    receive() external payable {
        if (!reentered) {
            reentered = true;
            escrow.refund(bountyId);
        }
    }
}
