
import sys
import os
import requests

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://localhost:8002/api"

def test_get_content():
    print("Testing File Content Retrieval...")
    
    # 1. Analyze Repo to get IDs
    repo_url = "https://github.com/octocat/Hello-World"
    try:
        response = requests.post(f"{BASE_URL}/git/analyze", json={"repo_url": repo_url})
        if response.status_code != 200:
            print(f"❌ Analysis failed: {response.text}")
            return
            
        data = response.json()
        if not data['files']:
            print("⚠️ No files found")
            return
            
        # Get first file ID
        target_file = data['files'][0]
        file_id = target_file['id']
        file_path = target_file['path']
        print(f"Target File: {file_path} (ID: {file_id})")
        
        # 2. Get Content
        content_res = requests.get(f"{BASE_URL}/files/{file_id}/content")
        
        if content_res.status_code == 200:
            content_data = content_res.json()
            content = content_data.get('content', '')
            print(f"✅ Content Retrieved ({len(content)} chars)")
            print(f"Preview: {content[:100]}...")
        else:
            print(f"❌ Failed to get content: {content_res.text}")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_get_content()
