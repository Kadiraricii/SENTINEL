
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid

from app.database import get_db
from app.services.git_service import GitService
from app.engine.batch_processor import BatchProcessor
from app.models import FileMetadata
from app.schemas.v2_schemas import GitAnalysisRequest, GitAnalysisResponse, GitEstimateRequest, GitEstimateResponse

router = APIRouter(prefix="/api/git", tags=["git"])

@router.post("/estimate", response_model=GitEstimateResponse)
async def estimate_repo(request: GitEstimateRequest):
    """
    Estimate clone/analysis time based on repo size.
    """
    git_service = GitService()
    info = git_service.get_repo_info(request.repo_url)
    
    size_kb = info.get('size_kb', 0)
    
    # Estimation logic:
    # Assume 5 Mbps download speed (~625 KB/s) for cloning
    # Plus ~10ms processing per KB for analysis overhead
    # Minimum 5 seconds
    
    if size_kb == 0:
        # Fallback if API fails
        return GitEstimateResponse(
            size_mb=0,
            estimated_seconds=15 # Default conservative estimate
        )
        
    download_seconds = size_kb / 625
    processing_seconds = size_kb * 0.005 # 5ms per KB
    
    total_seconds = int(download_seconds + processing_seconds + 5) # Buffer
    
    return GitEstimateResponse(
        size_mb=round(size_kb / 1024, 2),
        estimated_seconds=total_seconds
    )

@router.post("/analyze", response_model=GitAnalysisResponse)
async def analyze_repo(
    request: GitAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Clone and analyze a Git repository.
    """
    git_service = GitService()
    
    try:
        # 1. Clone Repo
        # Use a temporary stat object or pass empty dict for now as stats aren't strictly needed for clone
        repo_path = git_service.clone_repository({}, request.repo_url, request.branch)
        
        # 2. List Files
        files = git_service.list_repo_files(repo_path)
        
        if not files:
            git_service.cleanup_repo(repo_path)
            raise HTTPException(status_code=400, detail="No supported files found in repository")
            
        # 3. Create Batch
        batch_id = str(uuid.uuid4())
        
        # 4. Create File Records
        file_ids = []
        utc_now = datetime.utcnow()
        repo_name = request.repo_url.split('/')[-1].replace('.git', '')
        
        
        response_files_data = [] # Store for response
        
        for file_info in files:
            file_meta = FileMetadata(
                filename=f"{repo_name}/{file_info['relative_path']}", # Virtual path for display
                original_filename=file_info['filename'],
                file_type=file_info['extension'].lstrip('.'),
                file_size=file_info['size'],
                upload_date=utc_now,
                batch_id=batch_id,
                processing_status="pending",
                # STORE ABSOLUTE PATH so BatchProcessor can find it
                original_path=file_info['absolute_path'] 
            )
            db.add(file_meta)
            db.flush() # Get ID
            file_ids.append(file_meta.id)
            
            response_files_data.append({
                "path": file_info['relative_path'],
                "id": file_meta.id
            })
            
        db.commit()
        
        from app.routes.batch import batch_processors
        
        # 5. Start Batch Processing
        processor = BatchProcessor(db)
        batch_processors[batch_id] = processor  # Register for status polling
        
        # Run in background
        background_tasks.add_task(
            processor.process_batch, 
            batch_id, 
            file_ids
        )
        

        return GitAnalysisResponse(
            batch_id=batch_id,
            message="Repository cloned and analysis started",
            repo_name=repo_name,
            file_count=len(files),
            files=response_files_data
        )
        
    except Exception as e:
        # If we failed before creating batch, cleanup
        # If batch created, cleanup will happen eventually (TODO: Implement cleanup job)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{username}/repos")
async def get_user_repos(username: str):
    """
    Fetch all public repositories for a GitHub user.
    
    Args:
        username: GitHub username (e.g., "torvalds", "microsoft")
        
    Returns:
        List of repository metadata objects
    """
    git_service = GitService()
    
    try:
        repos = git_service.fetch_user_repos(username)
        
        return {
            "username": username,
            "total_repos": len(repos),
            "repositories": repos
        }
        
    except ValueError as e:
        # Handle user not found, rate limit, etc.
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")
