import os
import shutil
import tempfile
import uuid
import re
import socket
import ipaddress
from urllib.parse import urlparse
from typing import List, Dict, Optional
from pathlib import Path
import git

class GitService:
    """Service to handle Git repository operations."""
    
    # Supported extensions to index
    SUPPORTED_EXTENSIONS = {
        '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp', 
        '.go', '.rs', '.rb', '.php', '.cs', '.kt', '.sh', '.bash', 
        '.md', '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.sql', '.txt',
        '.dockerfile', 'Dockerfile', 'README', 'LICENSE', 'Makefile'
    }
    
    def __init__(self, base_temp_dir: str = "/tmp/hpes_git_repos"):
        self.base_temp_dir = base_temp_dir
        os.makedirs(self.base_temp_dir, exist_ok=True)

    def _validate_url(self, url: str):
        """
        Validate URL for SSRF and Command Injection.
        """
        # 1. Injection Prevention (Strict Regex)
        # Allow only: alphanumeric, -, ., _, /, :, @ (for auth)
        # Reject: ;, &, |, $, `, (, ), <, >, etc.
        if re.search(r'[;&|`$()<>]', url):
            raise ValueError("Invalid characters in URL. Potential detection of command injection.")

        # 2. Protocol Validation
        if not (url.startswith("http://") or url.startswith("https://")):
            raise ValueError("Invalid protocol. Only HTTP and HTTPS are allowed.")

        # 3. SSRF Protection (IP Blocking)
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                raise ValueError("Invalid URL: No hostname found")

            # Resolve DNS
            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)

            # Block Private and Loopback ranges
            if ip_obj.is_private or ip_obj.is_loopback:
                raise ValueError(f"Access denied to private/local network: {hostname} ({ip})")
                
        except Exception as e:
            raise ValueError(f"URL Validation failed: {str(e)}")
        
    def clone_repository(self, stats: Dict, repo_url: str, branch: str = None) -> str:
        """
        Clone a repository to a temporary directory.
        
        Args:
            repo_url: Public HTTPS URL of the repo
            branch: Optional branch name
            
        Returns:
            Path to cloned directory
        """
        # SECURITY CHECK: strict validation
        self._validate_url(repo_url)

        # Create a unique ID for this clone
        clone_id = str(uuid.uuid4())
        target_dir = os.path.join(self.base_temp_dir, clone_id)
        
        try:
            # Clone options
            options = ['--depth', '1']
            if branch:
                options.extend(['--branch', branch])
                
            print(f"Cloning {repo_url} to {target_dir}...")
            git.Repo.clone_from(repo_url, target_dir, depth=1, branch=branch if branch else None)
            
            # SECURITY: Remove execution permissions for ALL files
            # Directories get 755 (rwx-rx-rx) to be traversable
            # Files get 644 (rw-r--r--) to be non-executable
            for root, dirs, files in os.walk(target_dir):
                for d in dirs:
                    os.chmod(os.path.join(root, d), 0o755)
                for f in files:
                    os.chmod(os.path.join(root, f), 0o644)
            
            return target_dir
            
        except git.GitCommandError as e:
            # Cleanup if failed
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir)
            raise ValueError(f"Git clone failed: {str(e)}")
            
    def get_repo_info(self, repo_url: str) -> Dict:
        """
        Fetch repository metadata from GitHub API.
        Returns dict with size_kb, etc.
        """
        try:
            # Basic parsing of URL to get owner/repo
            # Expected format: https://github.com/owner/repo
            parts = repo_url.rstrip('/').split('/')
            if 'github.com' not in parts:
                 return {'size_kb': 0}
                 
            owner = parts[-2]
            repo = parts[-1].replace('.git', '')
            
            api_url = f"https://api.github.com/repos/{owner}/{repo}"
            
            import requests
            response = requests.get(api_url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'size_kb': data.get('size', 0), # Size is in KB
                    'default_branch': data.get('default_branch', 'main')
                }
            return {'size_kb': 0}
            
        except Exception as e:
            print(f"Error fetching repo info: {e}")
            return {'size_kb': 0}

    def list_repo_files(self, repo_path: str) -> List[Dict]:
        """
        Recursively list supported files in the repo.
        
        Returns:
            List of dicts with 'path', 'filename', 'extension'
        """
        files_to_process = []
        base_path = Path(repo_path)
        
        for root, _, files in os.walk(repo_path):
            # Skip .git directory
            if '.git' in root:
                continue
                
            for file in files:
                file_path = Path(root) / file
                
                # Check extension (or exact filename like Dockerfile)
                if file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS or file in self.SUPPORTED_EXTENSIONS:
                    # Get relative path for display
                    rel_path = file_path.relative_to(base_path)
                    
                    files_to_process.append({
                        'absolute_path': str(file_path),
                        'relative_path': str(rel_path),
                        'filename': file,
                        'extension': file_path.suffix.lower(),
                        'size': file_path.stat().st_size
                    })
                    
        return files_to_process

    def cleanup_repo(self, repo_path: str):
        """Delete the cloned directory."""
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path)
