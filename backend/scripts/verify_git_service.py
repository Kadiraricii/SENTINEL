
import sys
import os
import shutil

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.git_service import GitService

def test_git_service():
    print("Testing GitService...")
    service = GitService()
    
    # Use a small, public repo
    repo_url = "https://github.com/octocat/Hello-World"
    
    try:
        print(f"1. Cloning {repo_url}...")
        repo_path = service.clone_repository({}, repo_url)
        print(f"   Success! Cloned to: {repo_path}")
        
        print("2. Listing files...")
        files = service.list_repo_files(repo_path)
        print(f"   Found {len(files)} supported files:")
        for f in files:
            print(f"   - {f['filename']} ({f['size']} bytes)")
            
        print("3. Cleanup...")
        service.cleanup_repo(repo_path)
        if not os.path.exists(repo_path):
            print("   Success! Directory removed.")
            
        print("\n✅ GitService Verified Successfully")
        
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_git_service()
