
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
        
        # ── Contract 3: PropertyTransactionRegistry ─────────────────

        transaction_address = os.getenv(
            "PROPERTY_TRANSACTION_CONTRACT_ADDRESS",
            ""
        ).strip()

        transaction_abi = os.getenv(
            "PROPERTY_TRANSACTION_CONTRACT_ABI",
            ""
        ).strip()

        if transaction_address and transaction_abi:

            parsed_abi = (
                json.loads(transaction_abi)
                if isinstance(transaction_abi, str)
                else transaction_abi
            )

            self.property_transaction_contract = (
                self.w3.eth.contract(
                    address=Web3.to_checksum_address(
                        transaction_address
                    ),
                    abi=parsed_abi,
                )
            )

            logger.info(
                "PropertyTransactionRegistry loaded at %s",
                transaction_address
            )

        else:
            self.property_transaction_contract = None
            logger.warning(
                "PROPERTY_TRANSACTION_CONTRACT_ADDRESS / "
                "PROPERTY_TRANSACTION_CONTRACT_ABI not set."
            )


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
                "gas":      1000000,
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
    
    def _require_property_transaction_contract(self):

        if self.property_transaction_contract is None:
            raise RuntimeError(
                "PropertyTransactionRegistry contract "
                "is not configured."
            )
    def store_property_transaction(
        self,
        property_id,
        previous_owner_id,
        new_owner_id,
        total_paid,
        commission,
    ):
        self._require_property_transaction_contract()

        try:
            nonce = self.w3.eth.get_transaction_count(
                self.admin_address,
                "pending"
            )

            txn = (
                self.property_transaction_contract.functions
                .storeTransaction(
                    property_id,
                    previous_owner_id,
                    new_owner_id,
                    total_paid,
                    commission,
                )
                .build_transaction({
                    "chainId": 11155111,
                    "gas": 1000000,
                    "gasPrice": self.w3.eth.gas_price,
                    "nonce": nonce,
                    "from": self.admin_address,
                })
            )

            signed_txn = self.w3.eth.account.sign_transaction(
                txn,
                private_key=self.private_key
            )

            tx_hash = self.w3.eth.send_raw_transaction(
                signed_txn.raw_transaction
            )

            receipt = self.w3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=300,
                poll_latency=5

            )

            if receipt.status != 1:
                # print("Receipt Status:", receipt.status)
                # print("Receipt:", receipt)
                raise Exception("Transaction failed")

            return tx_hash.hex()

        except Exception as e:
            # print("REAL BLOCKCHAIN ERROR:", str(e))
            raise Exception(
                f"Failed to store property transaction: {str(e)}"
            )
        
    def get_property_transaction(
        self,
        property_id,
    ):
        self._require_property_transaction_contract()

        try:
            (
                property_id,
                previous_owner_id,
                new_owner_id,
                total_paid,
                commission,
                timestamp,
            ) = (
                self.property_transaction_contract.functions
                .getPropertyTransaction(property_id)
                .call()
            )

            return {
                "property_id": property_id,
                "previous_owner_id": previous_owner_id,
                "new_owner_id": new_owner_id,
                "total_paid": total_paid,
                "commission": commission,
                "timestamp": timestamp,
            }

        except Exception as e:
            raise Exception(
                f"Failed to fetch property transaction: {str(e)}"
            )
    
    def get_all_property_transactions(self):
        self._require_property_transaction_contract()

        try:
            transactions = (
                self.property_transaction_contract.functions
                .getAllTransactions()
                .call()
            )

            results = []

            for t in transactions:
                results.append({
                    "property_id": t[0],
                    "previous_owner_id": t[1],
                    "new_owner_id": t[2],
                    "total_paid": t[3],
                    "commission": t[4],
                    "timestamp": t[5],
                })

            return results

        except Exception as e:
            raise Exception(
                f"Failed to fetch all property transactions: {str(e)}"
            )
    

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
       
        self._require_document_contract()

        if not cid:
            raise ValueError("CID cannot be empty")
        if not document_type:
            raise ValueError("document_type cannot be empty")
        if not isinstance(property_id, int) or property_id <= 0:
            raise ValueError("property_id must be a positive integer")

        try:
            nonce = self.w3.eth.get_transaction_count(
                self.admin_address,
                "pending"
            )

            gas_price = self.w3.eth.gas_price

            # Prevent very low gas price
            minimum_gas_price = self.w3.to_wei(2, "gwei")

            if gas_price < minimum_gas_price:
                gas_price = minimum_gas_price

            logger.info(
                "Document transaction gas price: %s Gwei",
                self.w3.from_wei(gas_price, "gwei")
            )

            txn = self.document_contract.functions.storeDocument(
                cid,
                document_type,
                property_id,
            ).build_transaction({
                "chainId": 11155111,
                "gas": 300_000,
                "gasPrice": gas_price,
                "nonce": nonce,
                "from": self.admin_address,
            })
            signed_txn = self.w3.eth.account.sign_transaction(
                txn, private_key=self.private_key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            logger.info("Document tx sent: %s", tx_hash.hex())

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300,poll_latency=5)

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
       
        self._require_document_contract()

        try:
            return self.document_contract.functions.getDocumentsByProperty(
                property_id
            ).call()
        except Exception as exc:
            raise Exception(f"get_property_documents failed: {exc}") from exc

    def get_document_by_property(self, property_id: int) -> list:
       
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
       
        try:
            logs = self.document_contract.events.DocumentStored().process_receipt(
                receipt
            )
            if logs:
                return int(logs[0]["args"]["documentId"])
        except Exception as exc:
            logger.warning("Could not parse DocumentStored event: %s", exc)
        return 0



def convert_unix_timestamp(timestamp: int, timezone: str = "UTC") -> str:
   
    dt = datetime.utcfromtimestamp(timestamp)
    if timezone == "PKT":
        dt += timedelta(hours=5)
    return dt.strftime("%Y-%m-%d %H:%M:%S") + f" {timezone}"