"""
Batch Processing Engine
Handles parallel processing of multiple files with progress tracking
"""
import asyncio
from typing import List, Dict
from datetime import datetime
import os
from sqlalchemy.orm import Session

# Importlar projenizin yapısına göre ayarlandı
from app.models import FileMetadata, ExtractedBlock
from app.engine.normalizer import FileNormalizer
from app.engine.segmenter import Segmenter
from app.engine.validator import Validator
from app.engine.filter import PrecisionFilter
from app.services.secret_scanner import SecretScanner

class BatchProcessor:
    """Process multiple files in parallel with progress tracking"""
    
    def __init__(self, db: Session):
        self.db = db
        self.normalizer = FileNormalizer()
        self.segmenter = Segmenter()
        self.validator = Validator()
        self.filter = PrecisionFilter()
        
        # Track batch progress
        self.batch_status: Dict[str, Dict] = {}
    
    async def process_batch(
        self,
        batch_id: str,
        file_ids: List[int],
        session_id: int = None
    ) -> Dict:
        """Process multiple files in parallel"""
        # Initialize batch status
        self.batch_status[batch_id] = {
            "total_files": len(file_ids),
            "completed_files": 0,
            "failed_files": 0,
            "in_progress": True,
            "start_time": datetime.utcnow(),
            "file_statuses": {}
        }
        
        # Process files concurrently
        tasks = [
            self._process_single_file(batch_id, file_id, session_id)
            for file_id in file_ids
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update final status
        self.batch_status[batch_id]["in_progress"] = False
        self.batch_status[batch_id]["end_time"] = datetime.utcnow()
        
        return self.batch_status[batch_id]
    
    async def _process_single_file(
        self,
        batch_id: str,
        file_id: int,
        session_id: int = None
    ) -> Dict:
        """Process a single file within a batch"""
        file = None
        try:
            # Update file status initial
            self.batch_status[batch_id]["file_statuses"][file_id] = {
                "status": "processing",
                "start_time": datetime.utcnow(),
                "blocks_extracted": 0,
                "error": None
            }
            
            # Get file from database
            file = self.db.query(FileMetadata).filter(
                FileMetadata.id == file_id
            ).first()
            
            if not file:
                raise Exception(f"File {file_id} not found")
            
            # Update DB status
            file.processing_status = "processing"
            self.db.commit()
            
            # Determine file path
            if file.original_path and os.path.isabs(file.original_path) and os.path.exists(file.original_path):
                file_path = file.original_path
            else:
                # Fallback path logic
                file_path = os.path.join("data", "uploads", file.filename)
            
            # 1. Normalize
            if file.file_type == "pdf":
                normalized_result = await asyncio.to_thread(self.normalizer.normalize_file, file_path)
                normalized_text = normalized_result['content']
            elif file.file_type == "docx":
                normalized_result = await asyncio.to_thread(self.normalizer.normalize_file, file_path)
                normalized_text = normalized_result['content']
            else:
                # Text based files
                normalized_result = await asyncio.to_thread(self.normalizer.normalize_file, file_path)
                normalized_text = normalized_result['content']
            
            # 2. Segment
            # Returns List[CandidateBlock] objects
            segments = await asyncio.to_thread(
                self.segmenter.segment, normalized_text
            )
            
            extracted_blocks = []
            for segment in segments:
                # 3. Validate
                # Validator takes the whole CandidateBlock object, not just content string
                result = self.validator.validate_block(segment, filename=file.filename)
                
                if result['valid']:
                    # 4. Filter
                    # PrecisionFilter uses 'should_accept_block' method and takes the validation result dict
                    filter_result = self.filter.should_accept_block(result)
                    
                    if filter_result['accept']:
                        # 5. Secret Detection (Scan before saving)
                        has_secrets = SecretScanner.has_secrets(segment.content)
                        secret_types = SecretScanner.get_secret_types(segment.content) if has_secrets else []
                        secret_str = ",".join(secret_types) if secret_types else None

                        # Save block
                        block = ExtractedBlock(
                            file_id=file_id,
                            session_id=session_id,
                            content=segment.content,
                            language=result.get('language'),
                            block_type=result.get('block_type', 'code'),
                            # Use adjusted confidence if available, else validator confidence
                            confidence_score=result.get('confidence_score', 0),
                            validation_method=result.get('validation_method', 'unknown'),
                            start_line=segment.start_line,
                            end_line=segment.end_line,
                            has_secrets=has_secrets,
                            secret_type=secret_str
                        )
                        
                        self.db.add(block)
                        extracted_blocks.append(block)
            
            # Commit all blocks
            self.db.commit()
            
            # Update file status
            file.processing_status = "complete"
            self.db.commit()
            
            # Update batch progress
            self.batch_status[batch_id]["completed_files"] += 1
            self.batch_status[batch_id]["file_statuses"][file_id].update({
                "status": "complete",
                "end_time": datetime.utcnow(),
                "blocks_extracted": len(extracted_blocks),
                "error": None
            })
            
            return {
                "file_id": file_id,
                "status": "success",
                "blocks_count": len(extracted_blocks)
            }
            
        except Exception as e:
            # Handle error
            print(f"Error processing file {file_id}: {str(e)}") # Log for debug
            self.batch_status[batch_id]["failed_files"] += 1
            if file_id in self.batch_status[batch_id]["file_statuses"]:
                self.batch_status[batch_id]["file_statuses"][file_id].update({
                    "status": "error",
                    "end_time": datetime.utcnow(),
                    "error": str(e)
                })
            
            # Update file in database if possible
            if file:
                try:
                    file.processing_status = "error"
                    self.db.commit()
                except:
                    self.db.rollback()
            
            return {
                "file_id": file_id,
                "status": "error",
                "error": str(e)
            }
    
    def get_batch_status(self, batch_id: str) -> Dict:
        """Get current status of a batch"""
        return self.batch_status.get(batch_id, None)