// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentEscrow is ReentrancyGuard {
    enum Status {
        Open,
        Accepted,
        Submitted,
        Released,
        Refunded,
        Cancelled
    }

    struct Bounty {
        address requester;
        address agent;
        uint256 amount;
        string description;
        string submission;
        Status status;
        uint256 createdAt;
        uint256 workDeadline;
        uint256 reviewDeadline;
        uint256 workDuration;
        uint256 reviewPeriod;
        bool requesterCancellationApproved;
        bool agentCancellationApproved;
    }

    struct Rating {
        address requester;
        uint256 bountyId;
        uint8 score;
        uint256 ratedAt;
    }

    mapping(uint256 => Bounty) private _bounties;
    uint256 public bountyCount;

    mapping(address => Rating[]) public agentRatings;
    mapping(uint256 => bool) public bountyRated;

    event BountyCreated(
        uint256 indexed id,
        address indexed requester,
        address indexed agent,
        uint256 amount,
        string description,
        uint256 workDuration,
        uint256 reviewPeriod
    );
    event BountyAccepted(uint256 indexed id, address indexed agent, uint256 workDeadline);
    event WorkSubmitted(uint256 indexed id, address indexed agent, string submission, uint256 reviewDeadline);
    event BountyReleased(uint256 indexed id, address indexed agent, uint256 amount);
    event BountyRefunded(uint256 indexed id, address indexed requester, uint256 amount);
    event BountyCancelled(uint256 indexed id, address indexed requester, uint256 amount, bool mutual);
    event AgentRated(uint256 indexed bountyId, address indexed agent, address indexed requester, uint8 score);

    modifier bountyExists(uint256 id) {
        require(id < bountyCount, "Bounty does not exist");
        _;
    }

    function bounties(uint256 id) external view bountyExists(id) returns (Bounty memory) {
        return _bounties[id];
    }

    function createBounty(
        address designatedAgent,
        string calldata description,
        uint256 workDuration,
        uint256 reviewPeriod
    ) external payable returns (uint256 id) {
        require(msg.value > 0, "Bounty must include payment");
        require(designatedAgent != address(0), "Agent is required");
        require(designatedAgent != msg.sender, "Requester cannot be agent");
        require(workDuration > 0, "Work duration is required");
        require(reviewPeriod > 0, "Review period is required");

        id = bountyCount++;
        _bounties[id] = Bounty({
            requester: msg.sender,
            agent: designatedAgent,
            amount: msg.value,
            description: description,
            submission: "",
            status: Status.Open,
            createdAt: block.timestamp,
            workDeadline: 0,
            reviewDeadline: 0,
            workDuration: workDuration,
            reviewPeriod: reviewPeriod,
            requesterCancellationApproved: false,
            agentCancellationApproved: false
        });

        emit BountyCreated(
            id,
            msg.sender,
            designatedAgent,
            msg.value,
            description,
            workDuration,
            reviewPeriod
        );
    }

    function acceptBounty(uint256 id) external bountyExists(id) {
        Bounty storage bounty = _bounties[id];
        require(bounty.status == Status.Open, "Bounty not open");
        require(msg.sender == bounty.agent, "Only designated agent can accept");

        bounty.status = Status.Accepted;
        bounty.workDeadline = block.timestamp + bounty.workDuration;

        emit BountyAccepted(id, msg.sender, bounty.workDeadline);
    }

    function cancelOpenBounty(uint256 id) external bountyExists(id) nonReentrant {
        Bounty storage bounty = _bounties[id];
        require(msg.sender == bounty.requester, "Only requester can cancel");
        require(bounty.status == Status.Open, "Bounty not open");

        uint256 amount = bounty.amount;
        bounty.status = Status.Cancelled;

        (bool success, ) = bounty.requester.call{value: amount}("");
        require(success, "Cancellation transfer failed");

        emit BountyCancelled(id, bounty.requester, amount, false);
    }

    function submitWork(uint256 id, string calldata submission) external bountyExists(id) {
        Bounty storage bounty = _bounties[id];
        require(msg.sender == bounty.agent, "Only designated agent can submit");
        require(bounty.status == Status.Accepted, "Bounty not accepted");
        require(block.timestamp <= bounty.workDeadline, "Work deadline passed");
        require(bytes(submission).length > 0, "Submission is required");

        bounty.submission = submission;
        bounty.status = Status.Submitted;
        bounty.reviewDeadline = block.timestamp + bounty.reviewPeriod;

        emit WorkSubmitted(id, msg.sender, submission, bounty.reviewDeadline);
    }

    function release(uint256 id) external bountyExists(id) nonReentrant {
        Bounty storage bounty = _bounties[id];
        require(msg.sender == bounty.requester, "Only requester can release");
        require(bounty.status == Status.Submitted, "Bounty not submitted");
        _release(id, bounty);
    }

    function finalize(uint256 id) external bountyExists(id) nonReentrant {
        Bounty storage bounty = _bounties[id];
        require(bounty.status == Status.Submitted, "Bounty not submitted");
        require(block.timestamp >= bounty.reviewDeadline, "Review deadline not reached");

        _release(id, bounty);
    }

    function _release(uint256 id, Bounty storage bounty) private {
        uint256 amount = bounty.amount;
        address agent = bounty.agent;
        bounty.status = Status.Released;

        (bool success, ) = agent.call{value: amount}("");
        require(success, "Transfer to agent failed");

        emit BountyReleased(id, agent, amount);
    }

    function refundExpiredBounty(uint256 id) external bountyExists(id) nonReentrant {
        Bounty storage bounty = _bounties[id];
        require(msg.sender == bounty.requester, "Only requester can refund");
        require(bounty.status == Status.Accepted, "Bounty not accepted");
        require(block.timestamp >= bounty.workDeadline, "Work deadline not reached");

        uint256 amount = bounty.amount;
        bounty.status = Status.Refunded;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund transfer failed");

        emit BountyRefunded(id, msg.sender, amount);
    }

    function rateAgent(uint256 id, uint8 score) external {
        Bounty storage bounty = _bounties[id];
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
