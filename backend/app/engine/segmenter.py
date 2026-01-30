"""
Segmenter - Text Segmentation into Candidate Blocks
Identifies potential code/config blocks using multiple strategies.
"""
import re
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class CandidateBlock:
    """Represents a candidate code block."""
    content: str
    start_line: int
    end_line: int
    detection_method: str  # 'markdown', 'density', 'indentation', 'spacing'
    confidence: float
    language_hint: str = None


class Segmenter:
    """Segments text into potential code blocks."""
    
    # Technical characters that suggest code
    TECHNICAL_CHARS = set('{}[]()<>;:=+-*/%&|!~^#@$')
    
    # Common programming keywords
    KEYWORDS = {
        'def', 'class', 'function', 'var', 'let', 'const', 'import', 'export',
        'if', 'else', 'for', 'while', 'return', 'void', 'int', 'string',
        'public', 'private', 'static', 'async', 'await', 'try', 'catch'
    }
    
    def __init__(self, min_block_lines: int = 3):
        """
        Initialize segmenter.
        
        Args:
            min_block_lines: Minimum lines for a code block
        """
        self.min_block_lines = min_block_lines
    
    def segment(self, text: str) -> List[CandidateBlock]:
        """
        Segment text into candidate blocks using multiple strategies.
        
        Priority:
        1. Markdown code fences
        2. Indentation-based blocks
        3. Density analysis
        4. Line spacing
        
        Args:
            text: Input text
            
        Returns:
            List of CandidateBlock objects
        """
        candidates = []
        
        # Strategy 1: Markdown code fences (highest priority)
        markdown_blocks = self._extract_markdown_blocks(text)
        candidates.extend(markdown_blocks)
        
        # Get lines marked by markdown to avoid double-detection
        marked_lines = set()
        for block in markdown_blocks:
            marked_lines.update(range(block.start_line, block.end_line + 1))
        
        # Strategy 2: Indentation-based detection
        indent_blocks = self._extract_indented_blocks(text, marked_lines)
        candidates.extend(indent_blocks)
        
        # Update marked lines
        for block in indent_blocks:
            marked_lines.update(range(block.start_line, block.end_line + 1))
        
        # Strategy 3: Density analysis for unmarked regions
        density_blocks = self._extract_density_blocks(text, marked_lines)
        candidates.extend(density_blocks)
        
        return self._deduplicate_blocks(candidates)
    
    def _extract_markdown_blocks(self, text: str) -> List[CandidateBlock]:
        """Extract code blocks from markdown fences (```language)."""
        blocks = []
        lines = text.split('\n')
        
        in_block = False
        block_start = 0
        block_lines = []
        language_hint = None
        
        for i, line in enumerate(lines):
            # Check for code fence
            fence_match = re.match(r'^```(\w+)?', line.strip())
            
            if fence_match and not in_block:
                # Start of block
                in_block = True
                block_start = i
                language_hint = fence_match.group(1)
                block_lines = []
            
            elif line.strip().startswith('```') and in_block:
                # End of block
                if len(block_lines) >= self.min_block_lines:
                    blocks.append(CandidateBlock(
                        content='\n'.join(block_lines),
                        start_line=block_start + 1,
                        end_line=i - 1,
                        detection_method='markdown',
                        confidence=0.95,
                        language_hint=language_hint
                    ))
                
                in_block = False
                block_lines = []
                language_hint = None
            
            elif in_block:
                block_lines.append(line)
        
        return blocks
    
    def _extract_indented_blocks(self, text: str, marked_lines: set) -> List[CandidateBlock]:
        """Extract code blocks based on consistent indentation."""
        blocks = []
        lines = text.split('\n')
        
        current_block = []
        block_start = None
        base_indent = None
        
        for i, line in enumerate(lines):
            if i in marked_lines:
                # Finalize current block
                if current_block and len(current_block) >= self.min_block_lines:
                    blocks.append(CandidateBlock(
                        content='\n'.join(current_block),
                        start_line=block_start,
                        end_line=i - 1,
                        detection_method='indentation',
                        confidence=0.75
                    ))
                current_block = []
                block_start = None
                base_indent = None
                continue
            
            # Detect indentation
            indent = len(line) - len(line.lstrip())
            
            # Check if line has significant indentation (4+ spaces or tab)
            if line.strip() and (indent >= 4 or line.startswith('\t')):
                if not current_block:
                    block_start = i
                    base_indent = indent
                
                current_block.append(line)
            
            else:
                # End of indented region
                if current_block and len(current_block) >= self.min_block_lines:
                    # Verify this looks like code
                    block_text = '\n'.join(current_block)
                    if self._calculate_technical_density(block_text) > 0.15 or self._calculate_block_complexity(block_text) >= 2:
                        blocks.append(CandidateBlock(
                            content=block_text,
                            start_line=block_start,
                            end_line=i - 1,
                            detection_method='indentation',
                            confidence=0.85  # Higher confidence due to indentation + structure
                        ))
                
                current_block = []
                block_start = None
        
        return blocks
    
    def _extract_density_blocks(self, text: str, marked_lines: set) -> List[CandidateBlock]:
        """
        Extract blocks based on technical character density.
        Uses sliding window approach.
        """
        blocks = []
        lines = text.split('\n')
        
        window_size = 5
        threshold = 0.15  # 15% technical characters (Lowered from 0.20)
        
        i = 0
        while i < len(lines) - window_size:
            if i in marked_lines:
                i += 1
                continue
            
            # Calculate density for window
            window_text = '\n'.join(lines[i:i+window_size])
            density = self._calculate_technical_density(window_text)
            
            if density > threshold:
                # Find extent of high-density region
                start = i
                end = i + window_size
                
                # Expand forward
                while end < len(lines) and end not in marked_lines:
                    if self._calculate_technical_density(lines[end]) > threshold * 0.8:
                        end += 1
                    else:
                        break
                
                if end - start >= self.min_block_lines:
                    block_content = '\n'.join(lines[start:end])
                    
                    # Complexity Check: Require score >= 3 for density-based blocks (reduce false positives)
                    complexity = self._calculate_block_complexity(block_content)
                    
                    if complexity >= 3 or density > 0.30:  # Allow simple high-density blocks
                        blocks.append(CandidateBlock(
                            content=block_content,
                        start_line=start,
                        end_line=end - 1,
                        detection_method='density',
                        confidence=min(0.60, density)
                    ))
                
                i = end
            else:
                i += 1
        
        return blocks
    
    def _calculate_technical_density(self, text: str) -> float:
        """
        Calculate technical character density.
        
        Args:
            text: Input text
            
        Returns:
            Ratio of technical chars to total chars (0-1)
        """
        if not text.strip():
            return 0.0
        
        # Count technical characters
        tech_count = sum(1 for char in text if char in self.TECHNICAL_CHARS)
        
        # Count alphabetic characters (for keyword detection)
        words = text.split()
        keyword_count = sum(1 for word in words if word.lower() in self.KEYWORDS)
        
        # Calculate densities
        char_density = tech_count / max(len(text), 1)
        keyword_density = keyword_count / max(len(words), 1)
        
        # Combined score
        return (char_density * 0.7) + (keyword_density * 0.3)
    
    def _calculate_block_complexity(self, block: str) -> int:
        """Calculate structural complexity score."""
        score = 0
        # Functions/methods
        score += len(re.findall(r'\bdef\b|\bfunction\b|\bpublic\b|\bprivate\b', block))
        # Control flow
        score += len(re.findall(r'\bif\b|\bfor\b|\bwhile\b|\bswitch\b', block))
        # Classes
        score += len(re.findall(r'\bclass\b|\binterface\b|\bstruct\b', block))
        # Nested brackets (heuristic)
        if '{' in block and '}' in block: score += 1
        if '(' in block and ')' in block: score += 1
        return score

    def _deduplicate_blocks(self, blocks: List[CandidateBlock]) -> List[CandidateBlock]:
        """Remove overlapping blocks, keeping higher confidence."""
        if not blocks:
            return []
        
        # Sort by confidence (descending)
        sorted_blocks = sorted(blocks, key=lambda b: b.confidence, reverse=True)
        
        kept_blocks = []
        used_lines = set()
        
        for block in sorted_blocks:
            block_lines = set(range(block.start_line, block.end_line + 1))
            
            # Check for overlap
            if not block_lines.intersection(used_lines):
                kept_blocks.append(block)
                used_lines.update(block_lines)
        
        # Sort by line number for output
        return sorted(kept_blocks, key=lambda b: b.start_line)
