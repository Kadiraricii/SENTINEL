
import sys
import os
import requests

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://localhost:8002/api"

def test_batch_delete():
    print("Testing BATCH DELETE Endpoint...")
    
    # Test 1: Delete list of non-existent IDs -> Should succeed with 0 deleted
    payload = {"block_ids": [999998, 999999]}
    
    try:
        response = requests.post(f"{BASE_URL}/blocks/batch-delete", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            if data["deleted_count"] == 0:
                print("✅ Batch delete handled non-existent items correctly (0 deleted)")
            else:
                print("⚠️ Unexpected deletion count (should be 0)")
        else:
             print(f"❌ Failed: {response.text}")
             
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_batch_delete()
