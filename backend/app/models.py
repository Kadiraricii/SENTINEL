"""
Database models for HPES.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
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
    
    # Relationships
    blocks = relationship("ExtractedBlock", back_populates="file")


class ExtractedBlock(Base):
    """Extracted code/config block."""
    __tablename__ = "extracted_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("file_metadata.id"), nullable=False)
    
    # Block content
    content = Column(Text, nullable=False)
    language = Column(String, nullable=True)  # python, javascript, config, etc.
    block_type = Column(String, nullable=False)  # code, config, log, structured
    
    # Validation metadata
    confidence_score = Column(Float, default=0.0)  # 0-100
    validation_method = Column(String)  # tree-sitter, regex, schema, etc.
    
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
