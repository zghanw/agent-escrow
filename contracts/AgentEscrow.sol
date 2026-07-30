// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentEscrow is ReentrancyGuard {
    enum Status {
        Open,
        Claimed,
        Released,
        Refunded
    }

    struct Bounty {
        address requester;
        address agent;
        uint256 amount;
        string description;
        Status status;
        uint256 createdAt;
    }

    struct Rating {
        address requester;
        uint256 bountyId;
        uint8 score;
        uint256 ratedAt;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 public bountyCount;

    mapping(address => Rating[]) public agentRatings;
    mapping(uint256 => bool) public bountyRated;

    event BountyCreated(uint256 indexed id, address indexed requester, uint256 amount, string description);
    event BountyClaimed(uint256 indexed id, address indexed agent);
    event BountyReleased(uint256 indexed id, address indexed agent, uint256 amount);
    event BountyRefunded(uint256 indexed id, address indexed requester, uint256 amount);
    event AgentRated(uint256 indexed bountyId, address indexed agent, address indexed requester, uint8 score);

    function createBounty(string calldata description) external payable returns (uint256 id) {
        require(msg.value > 0, "Bounty must include payment");

        id = bountyCount++;
        bounties[id] = Bounty({
            requester: msg.sender,
            agent: address(0),
            amount: msg.value,
            description: description,
            status: Status.Open,
            createdAt: block.timestamp
        });

        emit BountyCreated(id, msg.sender, msg.value, description);
    }

    function claimBounty(uint256 id) external {
        Bounty storage bounty = bounties[id];
        require(bounty.status == Status.Open, "Bounty not open");
        require(msg.sender != bounty.requester, "Requester cannot claim own bounty");

        bounty.agent = msg.sender;
        bounty.status = Status.Claimed;

        emit BountyClaimed(id, msg.sender);
    }

    function release(uint256 id) external nonReentrant {
        Bounty storage bounty = bounties[id];
        require(msg.sender == bounty.requester, "Only requester can release");
        require(bounty.status == Status.Claimed, "Bounty not claimed");

        uint256 amount = bounty.amount;
        address agent = bounty.agent;
        bounty.status = Status.Released;

        (bool success, ) = agent.call{value: amount}("");
        require(success, "Transfer to agent failed");

        emit BountyReleased(id, agent, amount);
    }

    function refund(uint256 id) external nonReentrant {
        Bounty storage bounty = bounties[id];
        require(msg.sender == bounty.requester, "Only requester can refund");
        require(
            bounty.status == Status.Open || bounty.status == Status.Claimed,
            "Cannot refund in current state"
        );

        uint256 amount = bounty.amount;
        bounty.status = Status.Refunded;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund transfer failed");

        emit BountyRefunded(id, msg.sender, amount);
    }

    function rateAgent(uint256 id, uint8 score) external {
        Bounty storage bounty = bounties[id];
        require(msg.sender == bounty.requester, "Only requester can rate");
        require(bounty.status == Status.Released, "Bounty not released");
        require(!bountyRated[id], "Bounty already rated");
        require(score >= 1 && score <= 5, "Score must be 1-5");

        bountyRated[id] = true;
        agentRatings[bounty.agent].push(Rating({
            requester: msg.sender,
            bountyId: id,
            score: score,
            ratedAt: block.timestamp
        }));

        emit AgentRated(id, bounty.agent, msg.sender, score);
    }

    function getAgentRatingSummary(address agent) external view returns (uint256 totalScore, uint256 count) {
        Rating[] storage ratings = agentRatings[agent];
        count = ratings.length;
        for (uint256 i = 0; i < count; i++) {
            totalScore += ratings[i].score;
        }
    }
}
