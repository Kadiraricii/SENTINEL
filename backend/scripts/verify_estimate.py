
import sys
import os
import asyncio
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

client = TestClient(app)

def test_estimate():
    print("Testing Git Estimate Endpoint...")
    
    # Use a medium sized repo: axios
    repo_url = "https://github.com/axios/axios"
    
    try:
        response = client.post("/api/git/estimate", json={"repo_url": repo_url})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(f"  - Size: {data['size_mb']} MB")
            print(f"  - Estimated Time: {data['estimated_seconds']} seconds")
            
            if data['size_mb'] > 0:
                 print("✅ Estimate successful (Got size from GitHub)")
            else:
                 print("⚠️ Estimate returned 0 size (GitHub API might be rate limited or repo inaccurate)")
        else:
            print(f"❌ Failed: {response.text}")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_estimate()
