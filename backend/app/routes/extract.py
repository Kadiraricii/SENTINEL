"""
Extract Route - Trigger Extraction Process
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import time

from app.database import get_db
from app.models import FileMetadata, ExtractedBlock, BlockStatus
from app.schemas.schemas import ExtractionResponse, ExtractedBlockSchema
from app.engine.normalizer import FileNormalizer
from app.engine.segmenter import Segmenter
from app.engine.validator import Validator
from app.engine.filter import PrecisionFilter

router = APIRouter(prefix="/api", tags=["extract"])

UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "data" / "uploads"


@router.post("/extract/{file_id}", response_model=ExtractionResponse)
def extract_file(file_id: int, db: Session = Depends(get_db)):
    """
    Extract code blocks from uploaded file.
    
    Process:
    1. Load and normalize file
    2. Segment into candidate blocks
    3. Validate with hybrid engine
    4. Filter false positives
    5. Store results
    """
    start_time = time.time()
    
    # Get file metadata
    file_meta = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = UPLOAD_DIR / file_meta.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Initialize components
    normalizer = FileNormalizer()
    segmenter = Segmenter()
    validator = Validator()
    precision_filter = PrecisionFilter()
    
    # Step 1: Normalize
    try:
        normalized_data = normalizer.normalize_file(str(file_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Normalization failed: {e}")
    
    # Step 2: Segment
    candidate_blocks = segmenter.segment(normalized_data['content'])
    
    # Step 3: Validate
    validation_results = []
    for block in candidate_blocks:
        result = validator.validate_block(block)
        validation_results.append(result)
    
    # Step 4: Filter
    accepted_blocks = precision_filter.batch_filter(validation_results)
    
    # Step 5: Store in database
    db_blocks = []
    for block_data in accepted_blocks:
        db_block = ExtractedBlock(
            file_id=file_id,
            content=block_data['content'],
            language=block_data.get('language'),
            block_type=block_data['block_type'],
            confidence_score=block_data['confidence_score'],
            validation_method=block_data.get('validation_method'),
            start_line=block_data['start_line'],
            end_line=block_data['end_line'],
            status=BlockStatus.PENDING
        )
        db.add(db_block)
        db_blocks.append(db_block)
    
    db.commit()
    
    # Refresh to get IDs
    for block in db_blocks:
        db.refresh(block)
    
    processing_time = time.time() - start_time
    
    # Prepare response
    block_schemas = [
        ExtractedBlockSchema(
            id=block.id,
            content=block.content,
            language=block.language,
            block_type=block.block_type,
            confidence_score=block.confidence_score,
            validation_method=block.validation_method,
            start_line=block.start_line,
            end_line=block.end_line,
            status=block.status.value
        )
        for block in db_blocks
    ]
    
    return ExtractionResponse(
        file_id=file_id,
        filename=file_meta.original_filename,
        total_blocks=len(block_schemas),
        blocks=block_schemas,
        processing_time=round(processing_time, 3)
    )
