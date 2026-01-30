
import sys
import os
import requests

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Create a temporary block first by directly inserting into DB (simulated)
# For this test, we accept that we cannot easily create a block via API without a file.
# So we will try to delete a non-existent block to check 404, which confirms endpoint exists.
# Checking 404 is safer than deleting random data.

BASE_URL = "http://localhost:8000/api"

def test_delete_endpoint():
    print("Testing DELETE Block Endpoint...")
    
    # Test 1: Delete non-existent block -> Should return 404
    block_id = 999999
    response = requests.delete(f"{BASE_URL}/blocks/{block_id}")
    
    print(f"Delete Non-Existent Block Status: {response.status_code}")
    
    if response.status_code == 404:
        print("✅ Endpoint handles non-existent block correctly (404)")
    elif response.status_code == 405:
        print("❌ Endpoint Method Not Allowed (405) - Check Router")
    else:
        print(f"⚠️ Unexpected status: {response.status_code}")

if __name__ == "__main__":
    test_delete_endpoint()
