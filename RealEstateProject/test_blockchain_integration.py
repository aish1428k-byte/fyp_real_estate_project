#!/usr/bin/env python3
"""
Complete Continuous Real Blockchain Integration Test

This script performs a full, automated blockchain integration test that:
- Loads Django settings and verifies blockchain variables
- Connects to Sepolia testnet via Alchemy
- Instantiates the smart contract
- Calls read-only functions (admin, getLatestMerkleRoot)
- Signs and sends a write transaction (storeMerkleRoot)
- Waits for transaction confirmation
- Fetches and validates emitted events
- Reports structured results

No user input required - runs continuously from start to finish.
"""

import os
import sys
import django
import json
import time
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound
from eth_account import Account
from common.blockchain_utils import convert_unix_timestamp


def load_and_verify_settings():
    """Load Django settings and verify all required blockchain variables exist."""
    print("🔍 Loading and verifying Django settings...")

    try:
        # Check if settings are loaded
        rpc_url = getattr(settings, 'SEPOLIA_RPC_URL', None)
        private_key = getattr(settings, 'BLOCKCHAIN_PRIVATE_KEY', None)
        contract_address = getattr(settings, 'CONTRACT_ADDRESS', None)
        contract_abi = getattr(settings, 'CONTRACT_ABI', None)

        if not all([rpc_url, private_key, contract_address, contract_abi]):
            missing = []
            if not rpc_url: missing.append('SEPOLIA_RPC_URL')
            if not private_key: missing.append('BLOCKCHAIN_PRIVATE_KEY')
            if not contract_address: missing.append('CONTRACT_ADDRESS')
            if not contract_abi: missing.append('CONTRACT_ABI')
            raise ValueError(f"Missing required settings: {', '.join(missing)}")

        print("   ✅ All blockchain settings loaded successfully")
        print(f"   ✅ RPC URL: {rpc_url[:30]}...")
        print(f"   ✅ Contract Address: {contract_address}")
        print(f"   ✅ Private Key: {'*' * len(private_key) if private_key else 'None'}")
        print(f"   ✅ Contract ABI: {len(contract_abi)} functions loaded")

        return {
            'rpc_url': rpc_url,
            'private_key': private_key,
            'contract_address': contract_address,
            'contract_abi': contract_abi
        }

    except Exception as e:
        print(f"   ❌ Settings verification failed: {e}")
        return None


def connect_to_sepolia(rpc_url):
    """Connect to Sepolia testnet and confirm Web3 connection."""
    print("\n🔍 Connecting to Sepolia testnet...")

    try:
        w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not w3.is_connected():
            raise ConnectionError("Failed to connect to Sepolia RPC")

        # Get network info
        chain_id = w3.eth.chain_id
        latest_block = w3.eth.block_number

        print("   ✅ Connected to Sepolia testnet")
        print(f"   ✅ Chain ID: {chain_id}")
        print(f"   ✅ Latest Block: {latest_block}")

        return w3

    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return None


def instantiate_contract(w3, contract_address, contract_abi, private_key):
    """Instantiate the smart contract using address and ABI."""
    print("\n🔍 Instantiating smart contract...")

    try:
        # Validate contract address
        checksum_address = Web3.to_checksum_address(contract_address)

        # Create contract instance
        contract = w3.eth.contract(address=checksum_address, abi=contract_abi)

        # Validate contract code exists
        code = w3.eth.get_code(checksum_address)
        if code == b'':
            raise ValueError("No contract code found at address")

        # Set up account
        account = Account.from_key(private_key)
        admin_address = account.address

        print("   ✅ Contract instantiated successfully")
        print(f"   ✅ Contract Address: {checksum_address}")
        print(f"   ✅ Admin Address: {admin_address}")
        print(f"   ✅ Contract Code Size: {len(code)} bytes")

        return contract, account

    except Exception as e:
        print(f"   ❌ Contract instantiation failed: {e}")
        return None, None


def call_read_functions(contract):
    """Call all read-only functions: admin() and getLatestMerkleRoot()."""
    print("\n🔍 Calling read-only contract functions...")

    results = {}

    try:
        # Call admin()
        admin_address = contract.functions.admin().call()
        results['admin'] = admin_address
        print(f"   ✅ admin(): {admin_address}")

        # Call getLatestMerkleRoot()
        latest_root_result = contract.functions.getLatestMerkleRoot().call()
        merkle_root = Web3.to_hex(latest_root_result[0])
        timestamp = latest_root_result[1]

        results['latest_merkle_root'] = {
            'root': merkle_root,
            'timestamp': timestamp
        }

        if merkle_root == '0x' + '0' * 64:
            print("   ✅ getLatestMerkleRoot(): No roots stored yet")
        else:
            print(f"   ✅ getLatestMerkleRoot(): {merkle_root} at timestamp {timestamp}")

        return results

    except ContractLogicError as e:
        print(f"   ❌ Contract logic error: {e}")
        return None
    except Exception as e:
        print(f"   ❌ Read operations failed: {e}")
        return None


def send_write_transaction(w3, contract, account):
    """Sign and send a write transaction: storeMerkleRoot()."""
    print("\n🔍 Sending write transaction (storeMerkleRoot)...")

    try:
        # Generate a unique Merkle root for testing to avoid conflicts
        import random
        import string
        # Create a random hex string for testing
        random_hex = ''.join(random.choices(string.hexdigits.lower(), k=64))
        test_merkle_root = '0x' + random_hex

        print(f"   ⚠️  Using test Merkle root: {test_merkle_root}")
        print("   ⚠️  This will cost gas on Sepolia testnet!")

        # Get nonce
        nonce = w3.eth.get_transaction_count(account.address)

        # Get current gas price and increase it for replacement transactions
        base_gas_price = w3.eth.gas_price
        # Increase gas price by 20% to handle replacement transactions
        gas_price = int(base_gas_price * 1.2)

        # Build transaction
        txn = contract.functions.storeMerkleRoot(
            Web3.to_bytes(hexstr=test_merkle_root)
        ).build_transaction({
            'chainId': 11155111,  # Sepolia chain ID
            'gas': 200000,  # Conservative gas limit
            'gasPrice': gas_price,
            'nonce': nonce,
        })

        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(txn, account.key)

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        tx_hash_hex = Web3.to_hex(tx_hash)

        print(f"   ✅ Transaction sent: {tx_hash_hex}")

        # Wait for confirmation (up to 120 seconds)
        print("   ⏳ Waiting for transaction confirmation...")
        start_time = time.time()

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        wait_time = time.time() - start_time
        print(f"   ⏳ Transaction confirmed in {wait_time:.1f} seconds")
        if receipt.status != 1:
            raise Exception("Transaction failed (status != 1)")

        # Get block timestamp
        block = w3.eth.get_block(receipt.blockNumber)
        block_timestamp = block.timestamp

        print(f"   ✅ Transaction confirmed in block {receipt.blockNumber}")

        return {
            'tx_hash': tx_hash_hex,
            'block_number': receipt.blockNumber,
            'block_timestamp': block_timestamp,
            'gas_used': receipt.gasUsed,
            'merkle_root_sent': test_merkle_root
        }

    except Exception as e:
        print(f"   ❌ Write transaction failed: {e}")
        return None


def fetch_and_validate_events(w3, contract, tx_receipt, sent_merkle_root):
    """Fetch emitted events from the transaction and validate them."""
    print("\n🔍 Fetching and validating emitted events...")

    try:
        # Get events from transaction receipt
        merkle_root_stored_events = contract.events.MerkleRootStored().process_receipt(tx_receipt)

        if not merkle_root_stored_events:
            print("   ❌ No MerkleRootStored events found in transaction")
            return None

        # Process the first event (should be only one)
        event = merkle_root_stored_events[0]
        event_args = event['args']

        emitted_root = Web3.to_hex(event_args['merkleRoot'])
        emitted_timestamp = event_args['timestamp']

        print(f"   ✅ Event found: MerkleRootStored")
        print(f"   ✅ Emitted Merkle Root: {emitted_root}")
        print(f"   ✅ Emitted Timestamp: {emitted_timestamp}")

        # Validate the event matches what we sent
        if emitted_root.lower() == sent_merkle_root.lower():
            print("   ✅ Event validation: Merkle root matches sent data")
            validation_passed = True
        else:
            print("   ❌ Event validation: Merkle root mismatch!")
            print(f"      Sent: {sent_merkle_root}")
            print(f"      Emitted: {emitted_root}")
            validation_passed = False

        return {
            'event_name': 'MerkleRootStored',
            'emitted_merkle_root': emitted_root,
            'emitted_timestamp': emitted_timestamp,
            'validation_passed': validation_passed
        }

    except Exception as e:
        print(f"   ❌ Event fetching/validation failed: {e}")
        return None


def generate_report(results):
    """Generate a structured report of all test results."""
    print("\n" + "="*80)
    print("📊 BLOCKCHAIN INTEGRATION TEST REPORT")
    print("="*80)

    # Connection status
    connection_status = "✅ SUCCESS" if results.get('connection') else "❌ FAILED"
    print(f"Connection Status: {connection_status}")

    if results.get('connection'):
        print(f"  - Chain ID: {results['connection'].get('chain_id')}")
        print(f"  - Latest Block: {results['connection'].get('latest_block')}")

    # Contract admin
    if results.get('read_results') and results['read_results'].get('admin'):
        print(f"Contract Admin Address: {results['read_results']['admin']}")
    else:
        print("Contract Admin Address: ❌ Not retrieved")

    # Latest Merkle Root
    if results.get('read_results') and results['read_results'].get('latest_merkle_root'):
        root_info = results['read_results']['latest_merkle_root']
        if root_info['root'] == '0x' + '0' * 64:
            print("Latest Merkle Root: No roots stored yet")
        else:
            readable_timestamp = convert_unix_timestamp(root_info['timestamp'], "PKT")
            print(f"Latest Merkle Root: {root_info['root']} (timestamp: {root_info['timestamp']})")
            print(f"  - Human-readable: {readable_timestamp}")
    else:
        print("Latest Merkle Root: ❌ Not retrieved")

    # Transaction details
    if results.get('transaction'):
        tx_info = results['transaction']
        readable_block_timestamp = convert_unix_timestamp(tx_info['block_timestamp'], "PKT")
        print(f"Transaction Hash: {tx_info['tx_hash']}")
        print(f"Block Number: {tx_info['block_number']}")
        print(f"Block Timestamp: {tx_info['block_timestamp']}")
        print(f"  - Human-readable: {readable_block_timestamp}")
        print(f"Gas Used: {tx_info['gas_used']}")
        print(f"Merkle Root Sent: {tx_info['merkle_root_sent']}")
    else:
        print("Transaction Hash: ❌ Transaction failed")

    # Emitted Events
    if results.get('events'):
        event_info = results['events']
        readable_event_timestamp = convert_unix_timestamp(event_info['emitted_timestamp'], "PKT")
        print(f"Emitted Events: {event_info['event_name']}")
        print(f"  - Merkle Root: {event_info['emitted_merkle_root']}")
        print(f"  - Timestamp: {event_info['emitted_timestamp']}")
        print(f"    - Human-readable: {readable_event_timestamp}")
        validation = "✅ PASSED" if event_info['validation_passed'] else "❌ FAILED"
        print(f"  - Validation: {validation}")
    else:
        print("Emitted Events: ❌ No events retrieved")

    # Overall status
    all_steps_passed = all([
        results.get('settings'),
        results.get('connection'),
        results.get('contract'),
        results.get('read_results'),
        results.get('transaction'),
        results.get('events') and results['events'].get('validation_passed')
    ])

    print("\n" + "="*80)
    if all_steps_passed:
        print("🎉 ALL TESTS PASSED! Blockchain integration is fully functional.")
    else:
        print("⚠️  SOME TESTS FAILED! Check the output above for details.")
        print("Common issues:")
        print("- Verify .env file contains correct values")
        print("- Check internet connection and RPC endpoint")
        print("- Ensure sufficient Sepolia ETH for gas fees")
        print("- Confirm contract is deployed and accessible")

    return all_steps_passed


def main():
    """Main test execution function."""
    print("🚀 Starting Complete Blockchain Integration Test")
    print("This test will interact with the real Sepolia blockchain.\n")

    results = {}

    # Step 1: Load and verify settings
    settings_data = load_and_verify_settings()
    results['settings'] = settings_data is not None

    if not settings_data:
        generate_report(results)
        return False

    # Step 2: Connect to Sepolia
    w3 = connect_to_sepolia(settings_data['rpc_url'])
    results['connection'] = {
        'chain_id': w3.eth.chain_id if w3 else None,
        'latest_block': w3.eth.block_number if w3 else None
    } if w3 else None

    if not w3:
        generate_report(results)
        return False

    # Step 3: Instantiate contract
    contract, account = instantiate_contract(
        w3, settings_data['contract_address'],
        settings_data['contract_abi'], settings_data['private_key']
    )
    results['contract'] = contract is not None

    if not contract:
        generate_report(results)
        return False

    # Step 4: Call read functions
    read_results = call_read_functions(contract)
    results['read_results'] = read_results

    if not read_results:
        generate_report(results)
        return False

    # Step 5: Send write transaction
    transaction_result = send_write_transaction(w3, contract, account)
    results['transaction'] = transaction_result

    if not transaction_result:
        generate_report(results)
        return False

    # Step 6: Fetch and validate events
    # Need to get the transaction receipt for event processing
    try:
        tx_receipt = w3.eth.get_transaction_receipt(Web3.to_bytes(hexstr=transaction_result['tx_hash']))
        events_result = fetch_and_validate_events(w3, contract, tx_receipt, transaction_result['merkle_root_sent'])
        results['events'] = events_result
    except Exception as e:
        print(f"   ❌ Failed to get transaction receipt: {e}")
        results['events'] = None

    # Generate final report
    success = generate_report(results)

    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
