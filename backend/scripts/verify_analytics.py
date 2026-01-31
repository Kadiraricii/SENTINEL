
import requests
import json
import sys

BASE_URL = "http://localhost:8002/api"

def test_analytics():
    print("🧪 Testing Analytics API...")
    
    # 1. Trigger calculation
    print("\n[1] Triggering Daily Calculation...")
    try:
        resp = requests.post(f"{BASE_URL}/analytics/calculate-daily")
        if resp.status_code == 200:
            print(f"✅ Calculation Success: {resp.json()}")
        else:
            print(f"❌ Calculation Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Get Overview
    print("\n[2] Getting Overview...")
    try:
        resp = requests.get(f"{BASE_URL}/analytics/overview")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Overview Success:")
            print(f"   Files: {data['total_files']}")
            print(f"   Blocks: {data['total_blocks']}")
            print(f"   Avg Conf: {data['avg_confidence']}")
            print(f"   Languages: {len(data['language_distribution'])}")
        else:
            print(f"❌ Overview Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # 3. Get Trends
    print("\n[3] Getting Trends...")
    try:
        resp = requests.get(f"{BASE_URL}/analytics/trends?days=7")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Trends Success:")
            print(f"   Date Range: {data['date_range']}")
            print(f"   Daily Stats Count: {len(data['daily_stats'])}")
        else:
            print(f"❌ Trends Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # 4. Get Top Files
    print("\n[4] Getting Top Files...")
    try:
        resp = requests.get(f"{BASE_URL}/analytics/top-files")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Top Files Success:")
            print(f"   Count: {len(data)}")
            if len(data) > 0:
                print(f"   Top: {data[0]['filename']} ({data[0]['block_count']} blocks)")
        else:
            print(f"❌ Top Files Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_analytics()
