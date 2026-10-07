#!/usr/bin/env python3
"""
Critical-path testing for blockchain integration.

This script tests the essential components required for blockchain operations:
- Environment variable loading
- Django settings configuration
- Web3 connection to Sepolia testnet
- Contract read operations

Run this before any transaction-based testing.
"""

import os
import sys
import django
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from common.blockchain_utils import BlockchainService


def test_env_variables():
    """Test that required environment variables are loaded."""
    print("🔍 Testing environment variables...")

    required_vars = [
        'SEPOLIA_RPC_URL',
        'BLOCKCHAIN_PRIVATE_KEY',
        'CONTRACT_ADDRESS',
        'CONTRACT_ABI'
    ]

    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            print(f"   ✅ {var}: {'*' * len(value) if 'PRIVATE_KEY' in var else value[:20] + '...' if len(value) > 20 else value}")

    if missing_vars:
        print(f"   ❌ Missing environment variables: {missing_vars}")
        return False

    print("   ✅ All required environment variables are set")
    return True


def test_django_settings():
    """Test that Django settings are properly configured."""
    print("\n🔍 Testing Django settings...")

    try:
        rpc_url = getattr(settings, 'SEPOLIA_RPC_URL', None)
        if not rpc_url:
            print("   ❌ SEPOLIA_RPC_URL not found in Django settings")
            return False

        print(f"   ✅ SEPOLIA_RPC_URL loaded in settings: {rpc_url[:30]}...")

        # Check other settings are loaded
        private_key = getattr(settings, 'BLOCKCHAIN_PRIVATE_KEY', None)
        contract_address = getattr(settings, 'CONTRACT_ADDRESS', None)
        contract_abi = getattr(settings, 'CONTRACT_ABI', None)

        if not all([private_key, contract_address, contract_abi]):
            print("   ❌ Some blockchain settings missing in Django settings")
            return False

        print("   ✅ All blockchain settings loaded in Django")
        return True

    except Exception as e:
        print(f"   ❌ Error accessing Django settings: {e}")
        return False


def test_web3_connection():
    """Test Web3 connection to Sepolia testnet."""
    print("\n🔍 Testing Web3 connection to Sepolia...")

    try:
        blockchain = BlockchainService()

        if not blockchain.w3.is_connected():
            print("   ❌ Web3 not connected to Sepolia")
            return False

        # Get network info
        chain_id = blockchain.w3.eth.chain_id
        block_number = blockchain.w3.eth.block_number

        print(f"   ✅ Connected to Sepolia (Chain ID: {chain_id})")
        print(f"   ✅ Latest block: {block_number}")

        return True

    except Exception as e:
        print(f"   ❌ Web3 connection failed: {e}")
        return False


def test_contract_read():
    """Test contract read operations."""
    print("\n🔍 Testing contract read operations...")

    try:
        blockchain = BlockchainService()

        # Test reading the latest Merkle root
        result = blockchain.get_latest_merkle_root()

        if result is None:
            print("   ✅ Contract read successful (no Merkle roots stored yet)")
        else:
            merkle_root, timestamp = result
            print(f"   ✅ Latest Merkle root: {merkle_root}")
            print(f"   ✅ Timestamp: {timestamp}")

        # Test contract address validity
        contract_address = blockchain.contract.address
        code = blockchain.w3.eth.get_code(contract_address)

        if code == b'':
            print("   ❌ No contract code found at address")
            return False

        print(f"   ✅ Contract found at address: {contract_address}")
        return True

    except Exception as e:
        print(f"   ❌ Contract read failed: {e}")
        return False


def main():
    """Run all critical-path tests."""
    print("🚀 Starting critical-path testing for blockchain integration\n")

    tests = [
        ("Environment Variables", test_env_variables),
        ("Django Settings", test_django_settings),
        ("Web3 Connection", test_web3_connection),
        ("Contract Read Operations", test_contract_read),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))

    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "="*50)
    if all_passed:
        print("🎉 ALL CRITICAL-PATH TESTS PASSED!")
        print("You can now proceed to full integration testing with transactions.")
    else:
        print("⚠️  SOME TESTS FAILED!")
        print("Please fix the issues before proceeding to transaction testing.")
        print("\nCommon issues:")
        print("- Check your .env file exists and contains all required variables")
        print("- Verify SEPOLIA_RPC_URL is a valid Infura/Alchemy endpoint")
        print("- Ensure CONTRACT_ADDRESS and CONTRACT_ABI are correct")
        print("- Check your internet connection and RPC endpoint availability")

    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
