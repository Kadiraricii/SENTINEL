
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_search():
    print("🧪 Testing Search API...")
    
    # 1. Basic Search
    print("\n[1] Basic Text Search ('import')...")
    try:
        resp = requests.get(f"{BASE_URL}/search", params={"q": "import"})
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Search Success:")
            print(f"   Total Results: {data['total_results']}")
            if data['results']:
                first = data['results'][0]
                print(f"   First Result: {first['filename']} (Score: {first['match_score']})")
        else:
            print(f"❌ Search Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # 2. Filter by Language
    print("\n[2] Filter by Language (python)...")
    try:
        resp = requests.get(f"{BASE_URL}/search", params={"languages": ["python"]})
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Language Filter Success:")
            print(f"   Total Results: {data['total_results']}")
            for res in data['results'][:3]:
                print(f"   - {res['language']}: {res['confidence_score']}")
        else:
            print(f"❌ Filter Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # 3. Filter by Confidence
    print("\n[3] Filter by Confidence (> 0.9)...")
    try:
        resp = requests.get(f"{BASE_URL}/search", params={"min_confidence": 0.9})
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Confidence Filter Success:")
            print(f"   Total Results: {data['total_results']}")
            # Verify
            all_high = all(r['confidence_score'] >= 0.9 for r in data['results'])
            print(f"   Verification: {'Passed' if all_high else 'Failed'}")
        else:
            print(f"❌ Filter Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_search()
