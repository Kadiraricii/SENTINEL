"""
Upload Route - File Upload Endpoint
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
from pathlib import Path
import hashlib

from app.database import get_db
from app.models import FileMetadata
from app.schemas.schemas import FileUploadResponse

router = APIRouter(prefix="/api", tags=["upload"])


UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a file for extraction.
    
    Supports: PDF, DOCX, TXT, MD, LOG, SH, BAT, CONFIG, INI, YAML, JSON, XML
    """
    # Validate file type
    allowed_extensions = {
        '.pdf', '.docx', '.txt', '.md', '.log', '.sh', '.bat',
        '.config', '.ini', '.env', '.yaml', '.yml', '.json', '.xml'
    }
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {allowed_extensions}"
        )
    
    # Read file content to check size and calculate hash
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {file_size} bytes > {MAX_FILE_SIZE} bytes (50MB)"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Calculate file hash for deduplication
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check if file already exists
    existing_file = db.query(FileMetadata).filter(
        FileMetadata.file_hash == file_hash
    ).first()
    
    if existing_file:
        return FileUploadResponse(
            file_id=existing_file.id,
            filename=existing_file.filename,
            file_type=existing_file.file_type,
            file_size=existing_file.file_size,
            file_hash=existing_file.file_hash,
            message="File already exists (duplicate detected)"
        )
    
    # Save file to disk
    safe_filename = f"{file_hash[:16]}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Save metadata to database
    file_metadata = FileMetadata(
        filename=safe_filename,
        original_filename=file.filename,
        file_type=file_ext,
        file_size=file_size,
        file_hash=file_hash
    )
    
    db.add(file_metadata)
    db.commit()
    db.refresh(file_metadata)
    
    return FileUploadResponse(
        file_id=file_metadata.id,
        filename=file_metadata.filename,
        file_type=file_metadata.file_type,
        file_size=file_metadata.file_size,
        file_hash=file_metadata.file_hash
    )
