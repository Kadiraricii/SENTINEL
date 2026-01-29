"""
Text Normalizer - Input Scope & Normalization
Handles multiple file formats and normalizes text for processing.
"""
import ftfy
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional
import fitz  # PyMuPDF
from docx import Document


class FileNormalizer:
    """Normalizes various file formats into clean text."""
    
    SUPPORTED_FORMATS = {
        '.pdf', '.docx', '.txt', '.md', '.log', '.sh', '.bat',
        '.config', '.ini', '.env', '.yaml', '.yml', '.json', '.xml'
    }
    
    def __init__(self):
        """Initialize normalizer."""
        pass
    
    def normalize_file(self, file_path: str) ->  Dict:
        """
        Normalize a file to clean text with metadata.
        
        Args:
            file_path: Path to file
            
        Returns:
            Dict with 'content', 'metadata', 'file_hash'
        """
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {path.suffix}")
        
        # Extract text based on format
        if path.suffix.lower() == '.pdf':
            content = self._extract_pdf(path)
        elif path.suffix.lower() == '.docx':
            content = self._extract_docx(path)
        else:
            content = self._extract_text(path)
        
        # Normalize text
        normalized_content = self._normalize_text(content)
        
        # Generate metadata
        metadata = self._extract_metadata(path)
        
        # Generate file hash for deduplication
        file_hash = self._generate_hash(path)
        
        return {
            'content': normalized_content,
            'metadata': metadata,
            'file_hash': file_hash,
            'original_content': content  # Keep for comparison
        }
    
    def _extract_pdf(self, path: Path) -> str:
        """Extract text from PDF using PyMuPDF."""
        try:
            doc = fitz.open(path)
            text_blocks = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Extract text with layout preservation
                text = page.get_text("text")
                text_blocks.append(text)
            
            doc.close()
            return "\n\n".join(text_blocks)
        
        except Exception as e:
            raise ValueError(f"Failed to extract PDF: {e}")
    
    def _extract_docx(self, path: Path) -> str:
        """Extract text from DOCX."""
        try:
            doc = Document(path)
            paragraphs = [para.text for para in doc.paragraphs]
            return "\n".join(paragraphs)
        
        except Exception as e:
            raise ValueError(f"Failed to extract DOCX: {e}")
    
    def _extract_text(self, path: Path) -> str:
        """Extract text from plain text files."""
        try:
            # Try multiple encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    with open(path, 'r', encoding=encoding) as f:
                        return f.read()
                except UnicodeDecodeError:
                    continue
            
            # If all fail, read as binary and decode with errors='ignore'
            with open(path, 'rb') as f:
                return f.read().decode('utf-8', errors='ignore')
        
        except Exception as e:
            raise ValueError(f"Failed to read text file: {e}")
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize text:
        - Fix Unicode errors
        - Remove invisible control characters
        - Normalize whitespace
        """
        # Fix Unicode encoding issues
        text = ftfy.fix_text(text)
        
        # Remove invisible control characters (except newline, tab, carriage return)
        allowed_chars = {'\n', '\t', '\r'}
        text = ''.join(
            char for char in text
            if char in allowed_chars or not char.isprintable() is False
        )
        
        # Normalize excessive whitespace (but preserve code indentation)
        lines = text.split('\n')
        normalized_lines = []
        
        for line in lines:
            # Strip trailing whitespace, but keep leading (for indentation)
            normalized_lines.append(line.rstrip())
        
        return '\n'.join(normalized_lines)
    
    def _extract_metadata(self, path: Path) -> Dict:
        """Extract file metadata."""
        stat = path.stat()
        
        return {
            'filename': path.name,
            'original_path': str(path.absolute()),
            'file_type': path.suffix.lower(),
            'size_bytes': stat.st_size,
            'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
        }
    
    def _generate_hash(self, path: Path) -> str:
        """Generate SHA-256 hash of file for deduplication."""
        hasher = hashlib.sha256()
        
        with open(path, 'rb') as f:
            # Read in chunks for large files
            for chunk in iter(lambda: f.read(4096), b''):
                hasher.update(chunk)
        
        return hasher.hexdigest()
