"""
Database models for HPES.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class BlockStatus(str, enum.Enum):
    """Status of extracted block."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    MODIFIED = "modified"


class FeedbackAction(str, enum.Enum):
    """User feedback actions."""
    ACCEPT = "accept"
    REJECT = "reject"
    MODIFY = "modify"


class FileMetadata(Base):
    """Uploaded file metadata."""
    __tablename__ = "file_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, etc.
    file_size = Column(Integer, nullable=False)  # bytes
    file_hash = Column(String, unique=True, index=True)  # SHA-256 for deduplication
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # v2.0: Batch processing support
    batch_id = Column(String, nullable=True, index=True)
    processing_status = Column(String, default="pending")  # pending, processing, complete, error
    
    # Store absolute path for Git/Local files
    original_path = Column(String, nullable=True) 
    
    # Relationships
    blocks = relationship("ExtractedBlock", back_populates="file")
    sessions = relationship("SessionFile", back_populates="file")


class ExtractedBlock(Base):
    """Extracted code/config block."""
    __tablename__ = "extracted_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("file_metadata.id"), nullable=False)
    
    # v2.0: Session support
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True, index=True)
    
    # Block content
    content = Column(Text, nullable=False)
    language = Column(String, nullable=True)  # python, javascript, config, etc.
    block_type = Column(String, nullable=False)  # code, config, log, structured
    
    # Validation metadata
    confidence_score = Column(Float, default=0.0)  # 0-100
    validation_method = Column(String)  # tree-sitter, regex, schema, etc.
    
    # Secret Detection
    has_secrets = Column(Boolean, default=False)
    secret_type = Column(String, nullable=True)  # AWS, Google, Password, etc.
    
    # Block location in original document
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    
    # Status
    status = Column(Enum(BlockStatus), default=BlockStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("FileMetadata", back_populates="blocks")
    feedbacks = relationship("UserFeedback", back_populates="block")


class UserFeedback(Base):
    """User feedback for improving extraction accuracy."""
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("extracted_blocks.id"), nullable=False)
    
    action = Column(Enum(FeedbackAction), nullable=False)
    corrected_language = Column(String, nullable=True)  # If user changed language
    corrected_type = Column(String, nullable=True)  # If user changed type
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    block = relationship("ExtractedBlock", back_populates="feedbacks")


# ============================================================================
# v2.0 Models
# ============================================================================

class Session(Base):
    """User session for batch processing and state management."""
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session_metadata = Column(Text, nullable=True)  # JSON stored as TEXT (renamed from 'metadata')
    
    # Relationships
    files = relationship("SessionFile", back_populates="session")
    blocks = relationship("ExtractedBlock", foreign_keys="ExtractedBlock.session_id")


class SessionFile(Base):
    """Many-to-many relationship between sessions and files."""
    __tablename__ = "session_files"
    
    session_id = Column(Integer, ForeignKey("sessions.id"), primary_key=True)
    file_id = Column(Integer, ForeignKey("file_metadata.id"), primary_key=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="files")
    file = relationship("FileMetadata", back_populates="sessions")


class ExtractionStats(Base):
    """Daily aggregated statistics for analytics."""
    __tablename__ = "extraction_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, unique=True, index=True)
    total_files = Column(Integer, default=0)
    total_blocks = Column(Integer, default=0)
    language_stats = Column(Text, nullable=True)  # JSON: {"python": 15, "javascript": 10, ...}
    avg_confidence = Column(Float, default=0.0)


class TextInput(Base):
    """Direct text/markdown inputs from users."""
    __tablename__ = "text_inputs"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    source_type = Column(String, default="paste")  # 'paste' or 'markdown'
    created_at = Column(DateTime, default=datetime.utcnow)
    file_hash = Column(String, unique=True, index=True)  # For deduplication
