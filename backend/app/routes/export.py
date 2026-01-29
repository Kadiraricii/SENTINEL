"""
Export Route - Generate ZIP Archive with Categorized Files
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import zipfile
import json

from app.database import get_db
from app.models import ExtractedBlock, FileMetadata, BlockStatus

router = APIRouter(prefix="/api", tags=["export"])

EXPORT_DIR = Path(__file__).parent.parent.parent.parent / "data" / "exports"
EXPORT_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/export/{file_id}")
def export_blocks(file_id: int, db: Session = Depends(get_db)):
    """
    Export all accepted blocks as a ZIP archive.
    
    Structure:
    /python_codes/
    /javascript_codes/
    /configs/
    /logs/
    /structured/
    metadata.json
    """
    # Get file metadata
    file_meta = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get accepted blocks
    blocks = db.query(ExtractedBlock).filter(
        ExtractedBlock.file_id == file_id,
        ExtractedBlock.status == BlockStatus.ACCEPTED
    ).all()
    
    if not blocks:
        raise HTTPException(
            status_code=404,
            detail="No accepted blocks found. Please review and accept blocks first."
        )
    
    # Create ZIP file
    zip_filename = f"hpes_export_{file_id}_{file_meta.file_hash[:8]}.zip"
    zip_path = EXPORT_DIR / zip_filename
    
    # Categorize blocks
    categories = {}
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add blocks organized by category
        for idx, block in enumerate(blocks):
            # Determine folder based on block type and language
            if block.block_type == 'code':
                folder = f"{block.language}_codes"
                ext = _get_extension(block.language)
                filename = f"block_{idx+1:03d}{ext}"
            elif block.block_type == 'config':
                folder = "configs"
                ext = _get_config_extension(block.language)
                filename = f"{block.language}_{idx+1:03d}{ext}"
            elif block.block_type == 'log':
                folder = "logs"
                filename = f"log_{idx+1:03d}.log"
            elif block.block_type == 'structured':
                folder = "structured"
                ext = _get_extension(block.language)
                filename = f"data_{idx+1:03d}{ext}"
            else:
                folder = "other"
                filename = f"block_{idx+1:03d}.txt"
            
            # Track categories
            if folder not in categories:
                categories[folder] = 0
            categories[folder] += 1
            
            # Add to ZIP
            zip_path_in_archive = f"{folder}/{filename}"
            zipf.writestr(zip_path_in_archive, block.content)
        
        # Add metadata file
        metadata = {
            "source_file": file_meta.original_filename,
            "export_date": str(file_meta.upload_date),
            "total_blocks": len(blocks),
            "categories": categories,
            "blocks": [
                {
                    "id": block.id,
                    "type": block.block_type,
                    "language": block.language,
                    "confidence": block.confidence_score,
                    "lines": f"{block.start_line}-{block.end_line}"
                }
                for block in blocks
            ]
        }
        
        zipf.writestr("metadata.json", json.dumps(metadata, indent=2))
    
    # Return ZIP file
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=zip_filename
    )


def _get_extension(language: str) -> str:
    """Get file extension for language."""
    ext_map = {
        'python': '.py',
        'javascript': '.js',
        'typescript': '.ts',
        'java': '.java',
        'c': '.c',
        'cpp': '.cpp',
        'go': '.go',
        'rust': '.rs',
        'json': '.json',
        'yaml': '.yaml',
        'xml': '.xml',
    }
    return ext_map.get(language, '.txt')


def _get_config_extension(config_type: str) -> str:
    """Get extension for config files."""
    ext_map = {
        'cisco_ios': '.cfg',
        'nginx': '.conf',
        'json': '.json',
        'yaml': '.yaml',
        'xml': '.xml',
    }
    return ext_map.get(config_type, '.conf')
