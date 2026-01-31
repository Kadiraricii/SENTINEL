
import sys
import os
import requests

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://localhost:8002/api"

def test_extraction_fix():
    print("Testing Extraction Logic...")
    
    # 1. Analyze Repo to get IDs
    repo_url = "https://github.com/octocat/Hello-World"
    try:
        response = requests.post(f"{BASE_URL}/git/analyze", json={"repo_url": repo_url})
        if response.status_code != 200:
            print(f"❌ Analysis failed: {response.text}")
            return
            
        data = response.json()
        target_file = data['files'][0]
        file_id = target_file['id']
        print(f"Target File ID: {file_id}")
        
        # 2. Trigger Extraction (Should succeed now)
        print("Triggering extraction...")
        extract_res = requests.post(f"{BASE_URL}/extract/{file_id}")
        
        if extract_res.status_code == 200:
            print("✅ Extraction Successful!")
            blocks = extract_res.json().get('blocks', [])
            print(f"Blocks found: {len(blocks)}")
        else:
            print(f"❌ Extraction Failed: {extract_res.text}")
            
        # 3. Trigger AGAIN (Should be fast/idempotent)
        print("Triggering extraction again (idempotency check)...")
        extract_res_2 = requests.post(f"{BASE_URL}/extract/{file_id}")
        if extract_res_2.status_code == 200:
             print("✅ Re-extraction Successful!")
             blocks_2 = extract_res_2.json().get('blocks', [])
             print(f"Blocks found: {len(blocks_2)}")
             if len(blocks) == len(blocks_2):
                 print("✅ Block count matches (No duplication)")
             else:
                 print("⚠️ Block count mismatch (Duplication?)")
        else:
             print(f"❌ Re-extraction Failed: {extract_res_2.text}")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_extraction_fix()
