// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Bounded native-asset procurement authority. Physical fulfillment is tracked separately.
contract StandingProcurementAgreement {
    struct Agreement {
        address buyer;
        address payable supplier;
        address executor;
        bytes32 termsHash;
        uint256 start;
        uint256 expiry;
        uint256 perOrder;
        uint256 aggregate;
        uint256 spent;
        uint256 balance;
        uint256 cadence;
        uint256 lastOrder;
        uint256 nonce;
        bool accepted;
        bool paused;
        bool revoked;
    }
    mapping(bytes32 => Agreement) public agreements;
    mapping(bytes32 => bool) public executedOrders;
    bool private entered;
    event Created(bytes32 indexed id, address indexed buyer, address indexed supplier, bytes32 termsHash);
    event Accepted(bytes32 indexed id, bytes32 termsHash);
    event Paid(bytes32 indexed id, bytes32 indexed orderDigest, uint256 amount, uint256 nonce);
    event Paused(bytes32 indexed id, bool paused);
    event Revoked(bytes32 indexed id);

    modifier locked() { require(!entered, "REENTRY"); entered = true; _; entered = false; }
    function create(bytes32 id, address payable supplier, address executor, bytes32 termsHash, uint256 start, uint256 expiry, uint256 perOrder, uint256 aggregate, uint256 cadence) external payable {
        require(block.chainid == 296 || block.chainid == 31337, "TESTNET_ONLY");
        require(agreements[id].buyer == address(0), "EXISTS");
        require(supplier != address(0) && supplier != msg.sender && executor != address(0) && termsHash != bytes32(0), "PARTIES");
        require(expiry > block.timestamp && expiry > start && perOrder > 0 && aggregate >= perOrder && msg.value > 0 && msg.value <= aggregate, "LIMITS");
        agreements[id] = Agreement(msg.sender, supplier, executor, termsHash, start, expiry, perOrder, aggregate, 0, msg.value, cadence, 0, 0, false, false, false);
        emit Created(id, msg.sender, supplier, termsHash);
    }
    function accept(bytes32 id, bytes32 termsHash) external {
        Agreement storage a = agreements[id];
        require(msg.sender == a.supplier && termsHash == a.termsHash && !a.accepted && !a.revoked && block.timestamp < a.expiry, "ACCEPTANCE");
        a.accepted = true; emit Accepted(id, termsHash);
    }
    function fund(bytes32 id) external payable {
        Agreement storage a = agreements[id];
        require(msg.sender == a.buyer && !a.revoked && block.timestamp < a.expiry && msg.value > 0 && a.balance + a.spent + msg.value <= a.aggregate, "FUNDING");
        a.balance += msg.value;
    }
    function execute(bytes32 id, bytes32 orderDigest, bytes32 termsHash, uint256 amount, uint256 nonce) external locked {
        Agreement storage a = agreements[id];
        require(msg.sender == a.executor && a.accepted && !a.paused && !a.revoked, "AUTHORITY");
        require(block.timestamp >= a.start && block.timestamp < a.expiry && termsHash == a.termsHash, "TERMS");
        require(orderDigest != bytes32(0) && !executedOrders[orderDigest] && nonce == a.nonce, "REPLAY");
        require(a.lastOrder == 0 || block.timestamp >= a.lastOrder + a.cadence, "CADENCE");
        require(amount > 0 && amount <= a.perOrder && a.spent + amount <= a.aggregate && amount <= a.balance, "CAP");
        executedOrders[orderDigest] = true; a.spent += amount; a.balance -= amount; a.lastOrder = block.timestamp; a.nonce++;
        (bool paid,) = a.supplier.call{value: amount}(""); require(paid, "PAYMENT_FAILED");
        emit Paid(id, orderDigest, amount, nonce);
    }
    function pause(bytes32 id) external {
        Agreement storage a = agreements[id]; require(msg.sender == a.buyer || msg.sender == a.supplier, "PARTY");
        a.paused = true; emit Paused(id, true);
    }
    function resume(bytes32 id) external {
        Agreement storage a = agreements[id]; require(msg.sender == a.buyer && !a.revoked, "BUYER");
        a.paused = false; a.accepted = false; emit Paused(id, false);
    }
    function revoke(bytes32 id) external {
        Agreement storage a = agreements[id]; require(msg.sender == a.buyer || msg.sender == a.supplier, "PARTY");
        a.revoked = true; emit Revoked(id);
    }
    function withdraw(bytes32 id) external locked {
        Agreement storage a = agreements[id]; require(msg.sender == a.buyer && (a.revoked || block.timestamp >= a.expiry), "WITHDRAWAL");
        uint256 value = a.balance; a.balance = 0;
        (bool sent,) = payable(a.buyer).call{value:value}(""); require(sent, "WITHDRAWAL_FAILED");
    }
}
