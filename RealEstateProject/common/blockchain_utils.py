

# ________________ modeule 2_____________________________

"""
Blockchain utilities for interacting with Ethereum Sepolia testnet.
This module handles all blockchain operations for audit log anchoring.

Key Concepts for Beginners:
- Web3.py: Python library for Ethereum blockchain interaction
- RPC: Remote Procedure Call - how we communicate with the blockchain
- Gas: Fee paid for transactions on Ethereum
- Private Key: Secret key for signing transactions (NEVER expose!)
- ABI: Application Binary Interface - contract's function signatures

Why Blockchain for Auditing?
- Immutability: Once data is stored, it cannot be changed
- Decentralization: No single point of failure
- Transparency: Anyone can verify the data
"""

# import os
# import hashlib
# from typing import List, Tuple, Optional
# from datetime import datetime

# from web3 import Web3
# from web3.exceptions import ContractLogicError, TransactionNotFound
# from eth_account import Account
# from django.conf import settings




# class BlockchainService:
#     """
#     Service class for blockchain operations.
#     Handles connection, contract interaction, and transaction management.
#     """

#     def __init__(self):
#         """
#         Initialize blockchain connection and contract.
#         Requires environment variables:
#         - SEPOLIA_RPC_URL: Infura/Alchemy RPC endpoint
#         - BLOCKCHAIN_PRIVATE_KEY: Admin wallet private key
#         - CONTRACT_ADDRESS: Deployed contract address
#         - CONTRACT_ABI: Contract ABI as JSON string
#         """
#         # Connect to Sepolia testnet
#         self.rpc_url = settings.SEPOLIA_RPC_URL
#         if not self.rpc_url:
#             raise ValueError("SEPOLIA_RPC_URL environment variable not set")

#         self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
#         if not self.w3.is_connected():
#             raise ConnectionError("Failed to connect to Sepolia RPC")

#         # Load private key (NEVER log or expose this!)
#         self.private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
#         if not self.private_key:
#             raise ValueError("BLOCKCHAIN_PRIVATE_KEY environment variable not set")

#         self.account = Account.from_key(self.private_key)
#         self.admin_address = self.account.address

#         # Load contract
#         contract_address = os.getenv('CONTRACT_ADDRESS')
#         contract_abi = os.getenv('CONTRACT_ABI')

#         if not contract_address or not contract_abi:
#             raise ValueError("CONTRACT_ADDRESS and CONTRACT_ABI environment variables required")

#         self.contract = self.w3.eth.contract(
#             address=Web3.to_checksum_address(contract_address),
#             abi=contract_abi
#         )

#     # ----------------- EXISTING FUNCTIONS (UNCHANGED) -----------------

#     def build_merkle_tree(self, log_hashes: List[str]) -> str:
#         if not log_hashes:
#             raise ValueError("Cannot build Merkle tree from empty log list")
#         hashes = [bytes.fromhex(h.lstrip('0x')) for h in log_hashes]
#         if len(hashes) == 1:
#             return '0x' + hashes[0].hex()
#         current_level = hashes
#         while len(current_level) > 1:
#             next_level = []
#             for i in range(0, len(current_level), 2):
#                 left = current_level[i]
#                 right = current_level[i + 1] if i + 1 < len(current_level) else left
#                 parent_hash = hashlib.sha256(left + right).digest()
#                 next_level.append(parent_hash)
#             current_level = next_level
#         return '0x' + current_level[0].hex()

#     def store_merkle_root(self, merkle_root: str) -> Tuple[str, int]:
#         try:
#             if not Web3.is_hex(merkle_root) or len(merkle_root) != 66:
#                 raise ValueError("Invalid Merkle root format")
#             nonce = self.w3.eth.get_transaction_count(self.admin_address)
#             txn = self.contract.functions.storeMerkleRoot(
#                 Web3.to_bytes(hexstr=merkle_root)
#             ).build_transaction({
#                 'chainId': 11155111,  # Sepolia chain ID
#                 'gas': 200000,
#                 'gasPrice': self.w3.eth.gas_price,
#                 'nonce': nonce,
#             })
#             signed_txn = self.w3.eth.account.sign_transaction(txn, self.private_key)
#             tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
#             receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
#             if receipt.status != 1:
#                 raise Exception("Transaction failed")
#             block = self.w3.eth.get_block(receipt.blockNumber)
#             return Web3.to_hex(tx_hash), block.timestamp
#         except ContractLogicError as e:
#             raise Exception(f"Contract error: {str(e)}")
#         except TransactionNotFound:
#             raise Exception("Transaction not found on blockchain")
#         except Exception as e:
#             raise Exception(f"Blockchain error: {str(e)}")

#     def get_latest_merkle_root(self) -> Optional[Tuple[str, int]]:
#         try:
#             result = self.contract.functions.getLatestMerkleRoot().call()
#             merkle_root = Web3.to_hex(result[0])
#             timestamp = result[1]
#             return merkle_root, timestamp
#         except ContractLogicError:
#             return None
#         except Exception as e:
#             raise Exception(f"Error reading from blockchain: {str(e)}")


#     def add_log(self, user_type: str, username: str, action: str) -> str:
#         try:
#             nonce = self.w3.eth.get_transaction_count(self.admin_address)

#             txn = self.contract.functions.addLog(
#                 user_type,
#                 username,
#                 action
#             ).build_transaction({
#                 'chainId': 11155111,
#                 'gas': 300000,
#                 'gasPrice': self.w3.eth.gas_price,
#                 'nonce': nonce,
#                 'from': self.admin_address
#             })

#             signed_txn = self.w3.eth.account.sign_transaction(
#                 txn,
#                 private_key=self.private_key
#             )

#             tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

#             receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

#             if receipt.status != 1:
#                 raise Exception("Transaction failed")

#             return tx_hash.hex()

#         except Exception as e:
#             raise Exception(f"Failed to add log on blockchain: {str(e)}")




    #  module 2 comint woking starts
    # _______________---------------------------___________________



    # ----------------- NEW FUNCTION: ADD LOG TO CONTRACT -----------------
    
    
    # def add_log(self, user_type: str, username: str, action: str) -> str:
    #     """
    #     Call the AuditLog.sol contract to add a log for a user.

    #     Args:
    #         user_type: e.g., 'admin', 'manager', 'buyer'
    #         username: string username
    #         action: string action performed ('LOGIN', 'LOGOUT', etc.)

    #     Returns:
    #         Transaction hash of the blockchain transaction
    #     """
    #     try:
    #         tx = self.contract.functions.addLog(
    #             user_type,
    #             username,
    #             action
    #         ).transact({
    #             'from': self.admin_address
    #         })
    #         receipt = self.w3.eth.wait_for_transaction_receipt(tx, timeout=120)
    #         return receipt.transactionHash.hex()
    #     except Exception as e:
    #         raise Exception(f"Failed to add log on blockchain: {str(e)}")


#____________________________________

# class BlockchainService:
#     """
#     Service class for blockchain operations.
#     Handles connection, contract interaction, and transaction management.
#     """

#     def __init__(self):
#         """
#         Initialize blockchain connection and contract.
#         Requires environment variables:
#         - SEPOLIA_RPC_URL: Infura/Alchemy RPC endpoint
#         - BLOCKCHAIN_PRIVATE_KEY: Admin wallet private key
#         - CONTRACT_ADDRESS: Deployed contract address
#         - CONTRACT_ABI: Contract ABI as JSON string
#         """
#         # Connect to Sepolia testnet
#         self.rpc_url = settings.SEPOLIA_RPC_URL
#         if not self.rpc_url:
#             raise ValueError("SEPOLIA_RPC_URL environment variable not set")

#         self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
#         if not self.w3.is_connected():
#             raise ConnectionError("Failed to connect to Sepolia RPC")

#         # Load private key (NEVER log or expose this!)
#         self.private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
#         if not self.private_key:
#             raise ValueError("BLOCKCHAIN_PRIVATE_KEY environment variable not set")

#         self.account = Account.from_key(self.private_key)
#         self.admin_address = self.account.address

#         # Load contract
#         contract_address = os.getenv('CONTRACT_ADDRESS')
#         contract_abi = os.getenv('CONTRACT_ABI')

#         if not contract_address or not contract_abi:
#             raise ValueError("CONTRACT_ADDRESS and CONTRACT_ABI environment variables required")

#         self.contract = self.w3.eth.contract(
#             address=Web3.to_checksum_address(contract_address),
#             abi=contract_abi
#         )

#     def build_merkle_tree(self, log_hashes: List[str]) -> str:
#         """
#         Build a Merkle tree from log hashes and return the root.

#         Merkle Trees Explained:
#         - Each leaf is a hash of a log entry
#         - Parent nodes are hashes of concatenated children
#         - Root represents the entire dataset
#         - Allows efficient verification: prove one log without revealing all

#         Args:
#             log_hashes: List of SHA-256 hashes (hex strings)

#         Returns:
#             Merkle root as hex string (bytes32)
#         """
#         if not log_hashes:
#             raise ValueError("Cannot build Merkle tree from empty log list")

#         # Convert hex strings to bytes
#         hashes = [bytes.fromhex(h.lstrip('0x')) for h in log_hashes]

#         # If only one hash, it's the root
#         if len(hashes) == 1:
#             return '0x' + hashes[0].hex()

#         # Build tree level by level
#         current_level = hashes

#         while len(current_level) > 1:
#             next_level = []

#             # Process pairs
#             for i in range(0, len(current_level), 2):
#                 left = current_level[i]
#                 right = current_level[i + 1] if i + 1 < len(current_level) else left

#                 # Hash concatenation: H(left + right)
#                 combined = left + right
#                 parent_hash = hashlib.sha256(combined).digest()
#                 next_level.append(parent_hash)

#             current_level = next_level

#         return '0x' + current_level[0].hex()

#     def store_merkle_root(self, merkle_root: str) -> Tuple[str, int]:
#         """
#         Store Merkle root on blockchain and return transaction hash and block timestamp.

#         Args:
#             merkle_root: Hex string (0x prefixed, 64 chars)

#         Returns:
#             Tuple of (transaction_hash, block_timestamp)

#         Raises:
#             Exception: For various blockchain errors
#         """
#         try:
#             # Validate input
#             if not Web3.is_hex(merkle_root) or len(merkle_root) != 66:
#                 raise ValueError("Invalid Merkle root format")

#             # Get nonce
#             nonce = self.w3.eth.get_transaction_count(self.admin_address)

#             # Build transaction
#             txn = self.contract.functions.storeMerkleRoot(
#                 Web3.to_bytes(hexstr=merkle_root)
#             ).build_transaction({
#                 'chainId': 11155111,  # Sepolia chain ID
#                 'gas': 200000,  # Conservative gas limit
#                 'gasPrice': self.w3.eth.gas_price,
#                 'nonce': nonce,
#             })

#             # Sign transaction
#             signed_txn = self.w3.eth.account.sign_transaction(txn, self.private_key)

#             # Send transaction
#             tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

#             # Wait for confirmation
#             receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

#             if receipt.status != 1:
#                 raise Exception("Transaction failed")

#             # Get block timestamp
#             block = self.w3.eth.get_block(receipt.blockNumber)
#             block_timestamp = block.timestamp

#             return Web3.to_hex(tx_hash), block_timestamp

#         except ContractLogicError as e:
#             raise Exception(f"Contract error: {str(e)}")
#         except TransactionNotFound:
#             raise Exception("Transaction not found on blockchain")
#         except Exception as e:
#             raise Exception(f"Blockchain error: {str(e)}")

#     def get_latest_merkle_root(self) -> Optional[Tuple[str, int]]:
#         """
#         Retrieve the latest Merkle root from blockchain.

#         Returns:
#             Tuple of (merkle_root, timestamp) or None if no roots stored
#         """
#         try:
#             result = self.contract.functions.getLatestMerkleRoot().call()
#             merkle_root = Web3.to_hex(result[0])
#             timestamp = result[1]
#             return merkle_root, timestamp
#         except ContractLogicError:
#             # No roots stored yet
#             return None
#         except Exception as e:
#             raise Exception(f"Error reading from blockchain: {str(e)}")



# 
    #  module 2 comint woking ends


# ______________________-----------------------------__________________


#     def hash_log_entry(self, log_data: str) -> str:
#         """
#         Hash a single log entry using SHA-256.

#         Args:
#             log_data: String representation of log data

#         Returns:
#             Hex string hash
#         """
#         return '0x' + hashlib.sha256(log_data.encode('utf-8')).hexdigest()


# def convert_unix_timestamp(timestamp: int, timezone: str = "UTC") -> str:
#     """
#     Convert Unix timestamp to human-readable datetime string.

#     Args:
#         timestamp: Unix timestamp (seconds since Jan 1, 1970 UTC)
#         timezone: Target timezone ("UTC" or "PKT" for Pakistan Standard Time)

#     Returns:
#         Human-readable datetime string in format "YYYY-MM-DD HH:MM:SS TZ"

#     Example:
#         >>> convert_unix_timestamp(1769890764, "UTC")
#         '2026-02-01 15:12:44 UTC'
#         >>> convert_unix_timestamp(1769890764, "PKT")
#         '2026-02-01 20:12:44 PKT'
#     """
#     from datetime import datetime, timedelta

#     # Convert Unix timestamp to UTC datetime
#     dt = datetime.utcfromtimestamp(timestamp)

#     # Apply timezone offset if specified
#     if timezone == "PKT":
#         dt += timedelta(hours=5)  # Pakistan Standard Time is UTC+5

#     # Format as string
#     return dt.strftime("%Y-%m-%d %H:%M:%S") + f" {timezone}"


#  _______________module 2 ends here______________________



# _____________-new module ny claude________________

"""
common/blockchain/utils.py

Blockchain utilities for Ethereum Sepolia testnet.

Architecture
------------
TWO separate contracts are used:

  1. AuditLog contract  (CONTRACT_ADDRESS / CONTRACT_ABI)
     ─ addLog(), getUserLogs(), getUsersByType(), getAllLogs()
     ─ storeMerkleRoot(), getLatestMerkleRoot()
     ─ UNCHANGED — exactly as before

  2. DocumentRegistry contract  (DOCUMENT_CONTRACT_ADDRESS / DOCUMENT_CONTRACT_ABI)
     ─ storeDocument(), getDocument(), getDocumentsByProperty(), verifyCID()
     ─ NEW — document CID anchoring only

All EXISTING audit functions are preserved without any modification.
New document functions are added to the same BlockchainService class.
"""
# common/blockchain/utils.py
"""
Blockchain utilities for Ethereum Sepolia testnet.

TWO CONTRACTS — ONE FILE
────────────────────────
This file manages two completely separate contracts:

  Contract 1 — AuditLog  (your existing, already deployed contract)
  ─────────────────────────────────────────────────────────────────
  Loaded from:  CONTRACT_ADDRESS  +  CONTRACT_ABI  (already in your .env)
  Methods:      build_merkle_tree, store_merkle_root, get_latest_merkle_root,
                add_log, hash_log_entry
  Status:       UNCHANGED — not a single line modified.

  Contract 2 — DocumentRegistry  (new contract you deploy via Remix)
  ──────────────────────────────────────────────────────────────────
  Loaded from:  DOCUMENT_CONTRACT_ADDRESS  +  DOCUMENT_CONTRACT_ABI  (add to .env)
  Methods:      store_document_hash, get_document_by_id,
                get_property_documents, get_document_by_property,
                verify_document_cid
  Status:       NEW — added at the bottom of this class.

If DOCUMENT_CONTRACT_ADDRESS is not yet set, all audit functionality
continues working without any errors.
"""

import hashlib
import json
import logging
import os
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from eth_account import Account
from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound

from django.conf import settings

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Service class for all blockchain operations.

    self.contract          → AuditLog contract     (existing, unchanged)
    self.document_contract → DocumentRegistry contract (new, optional)
    """

    def __init__(self):
        # ── Connect to Sepolia ────────────────────────────────────────────────
        self.rpc_url = settings.SEPOLIA_RPC_URL
        if not self.rpc_url:
            raise ValueError("SEPOLIA_RPC_URL is not set")

        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError("Cannot connect to Sepolia — check SEPOLIA_RPC_URL")

        # ── Wallet ────────────────────────────────────────────────────────────
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        if not self.private_key:
            raise ValueError("BLOCKCHAIN_PRIVATE_KEY is not set")

        self.account       = Account.from_key(self.private_key)
        self.admin_address = self.account.address

        # ── Contract 1: AuditLog (EXISTING — UNCHANGED) ───────────────────────
        contract_address = os.getenv("CONTRACT_ADDRESS")
        contract_abi     = os.getenv("CONTRACT_ABI")
        

        if not contract_address or not contract_abi:
            raise ValueError(
                "CONTRACT_ADDRESS and CONTRACT_ABI must be set in .env"
            )
        contract_abi = json.loads(contract_abi)
        
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=contract_abi,
        )

        # ── Contract 2: DocumentRegistry (NEW — optional until deployed) ──────
        doc_address = os.getenv("DOCUMENT_CONTRACT_ADDRESS", "").strip()
        doc_abi     = os.getenv("DOCUMENT_CONTRACT_ABI",     "").strip()

        if doc_address and doc_abi:
            # ABI may arrive as a JSON string — parse it if so
            parsed_abi = json.loads(doc_abi) if isinstance(doc_abi, str) else doc_abi

            self.document_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(doc_address),
                abi=parsed_abi,
            )
            logger.info("DocumentRegistry loaded at %s", doc_address)
        else:
            self.document_contract = None
            logger.warning(
                "DOCUMENT_CONTRACT_ADDRESS / DOCUMENT_CONTRACT_ABI not set. "
                "Document blockchain methods are disabled until you add them."
            )

    # =========================================================================
    # EXISTING AUDIT METHODS — COMPLETELY UNCHANGED
    # =========================================================================

    def build_merkle_tree(self, log_hashes: List[str]) -> str:
        if not log_hashes:
            raise ValueError("Cannot build Merkle tree from empty log list")
        hashes = [bytes.fromhex(h.lstrip("0x")) for h in log_hashes]
        if len(hashes) == 1:
            return "0x" + hashes[0].hex()
        current_level = hashes
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left  = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                parent_hash = hashlib.sha256(left + right).digest()
                next_level.append(parent_hash)
            current_level = next_level
        return "0x" + current_level[0].hex()

    def store_merkle_root(self, merkle_root: str) -> Tuple[str, int]:
        try:
            if not Web3.is_hex(merkle_root) or len(merkle_root) != 66:
                raise ValueError("Invalid Merkle root format")
            nonce = self.w3.eth.get_transaction_count(self.admin_address)
            txn = self.contract.functions.storeMerkleRoot(
                Web3.to_bytes(hexstr=merkle_root)
            ).build_transaction({
                "chainId":  11155111,
                "gas":      200000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce":    nonce,
            })
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.private_key)
            tx_hash    = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt    = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt.status != 1:
                raise Exception("Transaction failed")
            block = self.w3.eth.get_block(receipt.blockNumber)
            return Web3.to_hex(tx_hash), block.timestamp
        except ContractLogicError as e:
            raise Exception(f"Contract error: {str(e)}")
        except TransactionNotFound:
            raise Exception("Transaction not found on blockchain")
        except Exception as e:
            raise Exception(f"Blockchain error: {str(e)}")

    def get_latest_merkle_root(self) -> Optional[Tuple[str, int]]:
        try:
            result      = self.contract.functions.getLatestMerkleRoot().call()
            merkle_root = Web3.to_hex(result[0])
            timestamp   = result[1]
            return merkle_root, timestamp
        except ContractLogicError:
            return None
        except Exception as e:
            raise Exception(f"Error reading from blockchain: {str(e)}")

    def add_log(self, user_type: str, username: str, action: str) -> str:
        try:
            nonce = self.w3.eth.get_transaction_count(self.admin_address)
            txn = self.contract.functions.addLog(
                user_type,
                username,
                action,
            ).build_transaction({
                "chainId":  11155111,
                "gas":      300000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce":    nonce,
                "from":     self.admin_address,
            })
            signed_txn = self.w3.eth.account.sign_transaction(
                txn, private_key=self.private_key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt.status != 1:
                raise Exception("Transaction failed")
            return tx_hash.hex()
        except Exception as e:
            raise Exception(f"Failed to add log on blockchain: {str(e)}")

    def hash_log_entry(self, log_data: str) -> str:
        """Hash a single log entry using SHA-256."""
        return "0x" + hashlib.sha256(log_data.encode("utf-8")).hexdigest()

    # =========================================================================
    # NEW DOCUMENT BLOCKCHAIN METHODS
    # =========================================================================

    def _require_document_contract(self) -> None:
        """
        Internal guard — called at the top of every document method.
        Raises RuntimeError if the DocumentRegistry contract is not yet configured.
        Your audit methods are never affected by this check.
        """
        if self.document_contract is None:
            raise RuntimeError(
                "DocumentRegistry contract is not configured. "
                "Add DOCUMENT_CONTRACT_ADDRESS and DOCUMENT_CONTRACT_ABI to your .env "
                "after deploying DocumentRegistry.sol in Remix."
            )

    def store_document_hash(
        self,
        cid: str,
        document_type: str,
        property_id: int,
    ) -> dict:
        """
        Store a verified IPFS CID on the DocumentRegistry contract.

        What this does, step by step:
          1. Builds a transaction calling storeDocument() on the contract
          2. Signs it with your BLOCKCHAIN_PRIVATE_KEY
          3. Broadcasts it to Sepolia
          4. Waits for the transaction to be mined (up to 120 seconds)
          5. Reads the DocumentStored event to get the auto-incremented on-chain ID
          6. Returns tx_hash, block_number, and on_chain_document_id

        Args:
            cid           – IPFS CID string from Pinata (e.g. "QmXoypiz...")
            document_type – type label (e.g. "cnic_front", "lease_sale")
            property_id   – Django DB PK of the Property row

        Returns:
            {
                "tx_hash":              "0x...",
                "block_number":         7654321,
                "on_chain_document_id": 3,
            }
        """
        self._require_document_contract()

        if not cid:
            raise ValueError("CID cannot be empty")
        if not document_type:
            raise ValueError("document_type cannot be empty")
        if not isinstance(property_id, int) or property_id <= 0:
            raise ValueError("property_id must be a positive integer")

        try:
            nonce     = self.w3.eth.get_transaction_count(self.admin_address, "pending")
            gas_price = self.w3.eth.gas_price

            txn = self.document_contract.functions.storeDocument(
                cid,
                document_type,
                property_id,
            ).build_transaction({
                "chainId":  11155111,   # Sepolia chain ID
                "gas":      300_000,
                "gasPrice": gas_price,
                "nonce":    nonce,
                "from":     self.admin_address,
            })

            signed_txn = self.w3.eth.account.sign_transaction(
                txn, private_key=self.private_key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            logger.info("Document tx sent: %s", tx_hash.hex())

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

            if receipt.status != 1:
                raise Exception(f"Transaction reverted. Hash: {tx_hash.hex()}")

            on_chain_id = self._parse_document_stored_event(receipt)

            logger.info(
                "CID stored on-chain. tx=%s on_chain_id=%s",
                tx_hash.hex(), on_chain_id,
            )

            return {
                "tx_hash":              tx_hash.hex(),
                "block_number":         receipt.blockNumber,
                "on_chain_document_id": on_chain_id,
            }

        except ContractLogicError as exc:
            raise Exception(f"Contract rejected the transaction: {exc}") from exc
        except TransactionNotFound:
            raise Exception("Transaction not found — Sepolia may be slow, retry.")
        except Exception as exc:
            raise Exception(f"store_document_hash failed: {exc}") from exc

    def get_document_by_id(self, on_chain_document_id: int) -> dict:
        """
        Read a single document record from the blockchain by its on-chain ID.

        The on-chain ID is the value returned by store_document_hash()
        and also saved in your Django DB as PropertyDocument.on_chain_document_id.

        Returns:
            {
                "cid":           "QmXoypiz...",
                "document_type": "cnic_front",
                "property_id":   42,
                "uploaded_by":   "0xAbc...",   # wallet address
                "timestamp":     1716123456,   # Unix seconds
            }
        """
        self._require_document_contract()

        try:
            cid, document_type, property_id, uploaded_by, timestamp = (
                self.document_contract.functions
                .getDocument(on_chain_document_id)
                .call()
            )
        except ContractLogicError as exc:
            raise Exception(
                f"Document ID {on_chain_document_id} not found on blockchain: {exc}"
            ) from exc
        except Exception as exc:
            raise Exception(f"get_document_by_id failed: {exc}") from exc

        return {
            "cid":           cid,
            "document_type": document_type,
            "property_id":   property_id,
            "uploaded_by":   uploaded_by,
            "timestamp":     timestamp,
        }

    def get_property_documents(self, property_id: int) -> list:
        """
        Return a list of on-chain document IDs for a given property.

        Use get_document_by_id() on each ID to read full details.

        Args:
            property_id – Django DB PK of the property

        Returns:
            [1, 3, 7, ...]  ← list of on-chain document IDs
        """
        self._require_document_contract()

        try:
            return self.document_contract.functions.getDocumentsByProperty(
                property_id
            ).call()
        except Exception as exc:
            raise Exception(f"get_property_documents failed: {exc}") from exc

    def get_document_by_property(self, property_id: int) -> list:
        """
        Convenience method — returns full document records for every
        document linked to a property, in one call.

        Internally calls get_property_documents() then get_document_by_id()
        for each ID.

        Args:
            property_id – Django DB PK of the property

        Returns:
            [
                {
                    "on_chain_document_id": 1,
                    "cid":           "QmXo...",
                    "document_type": "cnic_front",
                    "property_id":   42,
                    "uploaded_by":   "0x...",
                    "timestamp":     1716123456,
                },
                ...
            ]
        """
        self._require_document_contract()

        doc_ids = self.get_property_documents(property_id)
        results = []

        for doc_id in doc_ids:
            try:
                record = self.get_document_by_id(doc_id)
                record["on_chain_document_id"] = doc_id
                results.append(record)
            except Exception as exc:
                logger.warning("Could not fetch on-chain doc id=%s: %s", doc_id, exc)

        return results

    def verify_document_cid(self, on_chain_document_id: int, cid: str) -> bool:
        """
        Verify whether a CID matches what is stored on-chain.

        Useful for integrity checks: proves the document file has not been
        swapped since it was first anchored.

        Returns True if the CID matches, False if it does not or if the
        document ID does not exist.
        """
        self._require_document_contract()

        try:
            return self.document_contract.functions.verifyCID(
                on_chain_document_id, cid
            ).call()
        except Exception as exc:
            logger.error("verify_document_cid failed: %s", exc)
            return False

    # ── Private helper ────────────────────────────────────────────────────────

    def _parse_document_stored_event(self, receipt) -> int:
        """
        After a storeDocument() transaction is mined, the contract emits
        a DocumentStored event containing the auto-incremented document ID.
        This method reads that event and returns the ID.
        Falls back to 0 if the event cannot be parsed.
        """
        try:
            logs = self.document_contract.events.DocumentStored().process_receipt(
                receipt
            )
            if logs:
                return int(logs[0]["args"]["documentId"])
        except Exception as exc:
            logger.warning("Could not parse DocumentStored event: %s", exc)
        return 0


# =============================================================================
# Standalone helper — unchanged from original
# =============================================================================

def convert_unix_timestamp(timestamp: int, timezone: str = "UTC") -> str:
    """
    Convert a Unix timestamp to a human-readable string.

    Args:
        timestamp – Unix seconds (e.g. from block.timestamp)
        timezone  – "UTC" or "PKT" (Pakistan Standard Time, UTC+5)

    Returns:
        "YYYY-MM-DD HH:MM:SS TZ"

    Examples:
        convert_unix_timestamp(1769890764, "UTC") → "2026-02-01 15:12:44 UTC"
        convert_unix_timestamp(1769890764, "PKT") → "2026-02-01 20:12:44 PKT"
    """
    dt = datetime.utcfromtimestamp(timestamp)
    if timezone == "PKT":
        dt += timedelta(hours=5)
    return dt.strftime("%Y-%m-%d %H:%M:%S") + f" {timezone}"