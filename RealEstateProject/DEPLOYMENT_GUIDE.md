# Blockchain Audit Log Anchoring - Deployment Guide

## Overview
This guide will walk you through deploying the `AuditLogAnchor` smart contract to Ethereum Sepolia testnet and integrating it with your Django backend.

## Prerequisites
- MetaMask wallet installed and funded with Sepolia ETH
- Remix IDE access (https://remix.ethereum.org)
- Your Django project set up

## Step 1: Deploy Smart Contract

### 1.1 Open Remix IDE
1. Go to https://remix.ethereum.org
2. Create a new file named `AuditLogAnchor.sol`
3. Copy and paste the contract code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditLogAnchor {

    address public admin;

    struct AuditRoot {
        bytes32 merkleRoot;
        uint256 timestamp;
    }

    AuditRoot[] private auditRoots;

    event MerkleRootStored(bytes32 merkleRoot, uint256 timestamp);

    constructor() {
        admin = msg.sender;
    }

    function storeMerkleRoot(bytes32 root) external {
        require(msg.sender == admin, "Only admin can store Merkle root");
        require(root != bytes32(0), "Invalid Merkle root");

        auditRoots.push(
            AuditRoot({
                merkleRoot: root,
                timestamp: block.timestamp
            })
        );

        emit MerkleRootStored(root, block.timestamp);
    }

    function getLatestMerkleRoot()
        external
        view
        returns (bytes32 merkleRoot, uint256 timestamp)
    {
        require(auditRoots.length > 0, "No Merkle roots stored yet");

        AuditRoot memory latest = auditRoots[auditRoots.length - 1];
        return (latest.merkleRoot, latest.timestamp);
    }
}
```

### 1.2 Compile Contract
1. In Remix, go to "Solidity Compiler" tab
2. Select compiler version `0.8.19` (or latest 0.8.x)
3. Click "Compile AuditLogAnchor.sol"
4. Ensure compilation succeeds

### 1.3 Deploy to Sepolia
1. Go to "Deploy & Run Transactions" tab
2. **IMPORTANT**: Select "Injected Provider - MetaMask" as environment (NOT "Remix VM")
3. MetaMask will open - ensure you're connected to Sepolia testnet
4. If Sepolia isn't available in MetaMask:
   - Go to MetaMask settings
   - Add network manually:
     - Network Name: Sepolia
     - RPC URL: https://rpc.sepolia.org
     - Chain ID: 11155111
     - Currency Symbol: SepoliaETH
5. Click "Deploy" in Remix
6. MetaMask popup will appear - confirm the transaction
7. Wait for deployment confirmation on Sepolia (may take 15-30 seconds)

### 1.4 Get Contract Details
After deployment:
- **Contract Address**: Copy from Remix (e.g., `0x1234567890123456789012345678901234567890`)
- **ABI**: Click "ABI" button in Remix, copy the JSON array

## Step 2: Configure Django Backend

### 2.1 Set Environment Variables
Create a `.env` file in your project root:

```bash
# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_WITHOUT_0x_PREFIX
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
CONTRACT_ABI='[{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},...]'
```

**Security Notes:**
- Get Infura RPC URL from https://infura.io
- NEVER commit `.env` file to git
- Private key should be from a test wallet only

### 2.2 Install Dependencies
```bash
pip install web3
```

### 2.3 Run Migrations
```bash
python manage.py makemigrations audit
python manage.py migrate
```

## Step 3: Test Integration

### 3.1 Start Django Server
```bash
python manage.py runserver
```

### 3.2 Test API Endpoint
Use Postman or curl to test:

```bash
curl -X POST \
  http://localhost:8000/api/audit/anchor-logs/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
    "merkle_root": "0x...",
    "transaction_hash": "0x...",
    "block_timestamp": 1234567890,
    "explorer_url": "https://sepolia.etherscan.io/tx/...",
    "logs_anchored": 5
}
```

## Step 4: Verify on Blockchain

1. Go to https://sepolia.etherscan.io
2. Search for your contract address
3. Check "Transactions" tab to see Merkle root storage
4. Click on transaction hash to verify details

## Troubleshooting

### Common Issues:

1. **Deployed to Remix VM instead of Sepolia**
   - **Problem**: Remix defaults to local VM, not real blockchain
   - **Solution**: Always select "Injected Provider - MetaMask" in Remix
   - **Check**: If block number is low (like 4) and address starts with 0x5B38..., it's Remix VM
   - **Fix**: Redeploy with MetaMask connected to Sepolia

2. **MetaMask not connecting to Sepolia**
   - Ensure Sepolia testnet is selected in MetaMask
   - Add Sepolia manually if needed (Chain ID: 11155111)

3. **Transaction failing**
   - Check if you have enough Sepolia ETH (get from https://sepoliafaucet.com)
   - Verify contract address and ABI are correct

4. **RPC connection errors**
   - Check your Infura project ID
   - Ensure SEPOLIA_RPC_URL is correct

5. **Private key errors**
   - Ensure private key is 64 characters (without 0x)
   - Never use mainnet private keys

## Academic Notes

- **Merkle Trees**: Used to efficiently hash multiple logs into a single root, allowing verification without storing all data on-chain
- **Blockchain Immutability**: Once stored, Merkle roots cannot be altered, providing tamper-proof audit trails
- **Gas Efficiency**: Storing only 32-byte roots vs. full logs saves significant gas costs
- **Security**: Admin-only access ensures only authorized anchoring

## Next Steps

1. Integrate with your existing audit logging system
2. Add more log types (OTP verification, property creation, etc.)
3. Implement log verification endpoints
4. Consider production deployment on mainnet (with caution!)

---

**Remember**: This is for educational purposes. Always test thoroughly and never use real funds for testing.
