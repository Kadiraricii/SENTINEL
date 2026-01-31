
import sys
import os
import requests

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://localhost:8002/api"

def test_file_list():
    print("Testing Git File Visibility...")
    
    # Use a tiny valid repo
    repo_url = "https://github.com/octocat/Hello-World"
    
    try:
        response = requests.post(f"{BASE_URL}/git/analyze", json={"repo_url": repo_url})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"File Count: {data['file_count']}")
            print("Files returned:")
            for f in data.get('files', [])[:5]:
                if isinstance(f, dict):
                    print(f" - {f.get('path')} (ID: {f.get('id')})")
                else:
                    print(f" - {f} (Legacy/Error)")
            
            if 'files' in data and len(data['files']) > 0 and isinstance(data['files'][0], dict):
                print("✅ 'files' list contains objects with IDs")
            else:
                 print("⚠️ 'files' list format incorrect")
        else:
            print(f"❌ Failed: {response.text}")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_file_list()
