
import requests
import os

BASE_URL = "http://localhost:8002/api"

def test_upload():
    print("🧪 Debugging Upload...")
    
    # Create a dummy file
    with open("test_doc.txt", "w") as f:
        f.write("This is a test document for upload debugging.")
        
    try:
        files = {'file': open('test_doc.txt', 'rb')}
        resp = requests.post(f"{BASE_URL}/upload", files=files)
        
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    finally:
        if os.path.exists("test_doc.txt"):
            os.remove("test_doc.txt")

if __name__ == "__main__":
    test_upload()
