#!/usr/bin/env python3
"""
Test script for the convert_unix_timestamp function.

This script demonstrates the usage of the convert_unix_timestamp function
with various Unix timestamps and timezones.
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

from common.blockchain_utils import convert_unix_timestamp

def test_timestamp_conversion():
    """Test the convert_unix_timestamp function with various inputs."""

    print("🕒 Testing Unix Timestamp Conversion")
    print("=" * 50)

    # Test cases
    test_cases = [
        (1769890764, "UTC"),  # Future timestamp
        (1769890764, "PKT"),  # Same timestamp in PKT
        (1609459200, "UTC"),  # January 1, 2021 UTC
        (1609459200, "PKT"),  # January 1, 2021 PKT
        (0, "UTC"),           # Unix epoch
        (0, "PKT"),           # Unix epoch in PKT
    ]

    for timestamp, timezone in test_cases:
        try:
            result = convert_unix_timestamp(timestamp, timezone)
            print(f"Unix Timestamp: {timestamp}")
            print(f"Timezone: {timezone}")
            print(f"Human-readable: {result}")
            print("-" * 30)
        except Exception as e:
            print(f"Error converting timestamp {timestamp} to {timezone}: {e}")
            print("-" * 30)

    # Example from the task description
    print("\n📋 Example from Task Description:")
    unix_ts = 1769890764
    result_utc = convert_unix_timestamp(unix_ts, "UTC")
    result_pkt = convert_unix_timestamp(unix_ts, "PKT")

    print(f"Input: {unix_ts}")
    print(f"UTC: {result_utc}")
    print(f"PKT: {result_pkt}")

if __name__ == "__main__":
    test_timestamp_conversion()
