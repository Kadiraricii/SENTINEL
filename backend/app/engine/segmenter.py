"""
Segmenter - Text Segmentation into Candidate Blocks
Identifies potential code/config blocks using multiple strategies.
"""
import re
from typing import List
from dataclasses import dataclass

@dataclass
class CandidateBlock:
    """Represents a candidate code block."""
    content: str
    start_line: int
    end_line: int
    detection_method: str
    confidence: float
    language_hint: str = None

class Segmenter:
    """Segments text into potential code blocks."""
    
    TECHNICAL_CHARS = set('{}[]()<>;:=+-*/%&|!~^#@$')
    KEYWORDS = {
        'def', 'class', 'function', 'var', 'let', 'const', 'import', 'export',
        'if', 'else', 'for', 'while', 'return', 'void', 'int', 'string',
        'public', 'private', 'static', 'async', 'await', 'try', 'catch'
    }
    SECTION_PATTERN = re.compile(r'^[#/\*]+\s*-+\s*SECTION:\s*([A-Z_]+)\s*-+.*$', re.IGNORECASE)
    
    def __init__(self, min_block_lines: int = 3):
        self.min_block_lines = min_block_lines
    
    def segment(self, text: str) -> List[CandidateBlock]:
        candidates = []
        
        # 1. Custom Delimiters (Explicit)
        delimited_blocks = self._extract_delimited_blocks(text)
        candidates.extend(delimited_blocks)

        marked_lines = set()
        for block in delimited_blocks:
            marked_lines.update(range(block.start_line, block.end_line + 1))

        # 2. Markdown Fences
        markdown_blocks = self._extract_markdown_blocks(text)
        for block in markdown_blocks:
             if not any(i in marked_lines for i in range(block.start_line, block.end_line + 1)):
                 candidates.append(block)
                 marked_lines.update(range(block.start_line, block.end_line + 1))
        
        # 3. Indentation
        indent_blocks = self._extract_indented_blocks(text, marked_lines)
        candidates.extend(indent_blocks)
        for block in indent_blocks:
            marked_lines.update(range(block.start_line, block.end_line + 1))
        
        # 4. Top-Level Keywords (New Strategy for standard files)
        keyword_blocks = self._extract_toplevel_blocks(text, marked_lines)
        candidates.extend(keyword_blocks)
        for block in keyword_blocks:
            marked_lines.update(range(block.start_line, block.end_line + 1))

        # 5. Density
        density_blocks = self._extract_density_blocks(text, marked_lines)
        candidates.extend(density_blocks)
        
        return self._deduplicate_blocks(candidates)

    def _extract_toplevel_blocks(self, text: str, marked_lines: set) -> List[CandidateBlock]:
        """
        Extract blocks starting with top-level keywords (def, class, import, etc.)
        Useful for standard code files without indentation.
        """
        blocks = []
        lines = text.split('\n')
        
        # Keywords that typically start a top-level block
        START_KEYWORDS = {
            'import', 'from', 'package', 'namespace',
            'def', 'class', 'func', 'function', # Python, Go, JS
            'pub', 'fn', 'struct', 'enum', 'impl', # Rust
            'interface', 'type', 'const', 'var', 'let', # TS/JS/Go
            'public', 'private', 'protected', 'void', # Java/C#
            '#include', '#define', 'using', 'typedef', # C/C++
            'if', 'else', 'try', 'catch', 'finally', # Common Control Flow
            '<?php', 'require', 'include', 'trait', 'abstract', 'final', # PHP
            'module', 'require_relative', 'alias', # Ruby
            'fun', 'val', 'data', 'object', # Kotlin
            'export', 'echo', 'source', 'alias', '#', # Bash
            '<!DOCTYPE', '<html', '<head', '<body', '<div', '<script', '<style', # HTML
            '@media', '@import', # CSS
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER' # SQL
        }
        
        i = 0
        while i < len(lines):
            if i in marked_lines:
                i += 1
                continue
            
            line = lines[i]
            first_word = line.strip().split(' ')[0] if line.strip() else ''
            
            # Check if line starts with a keyword or shebang
            is_start = False
            
            if first_word in START_KEYWORDS:
                is_start = True
            elif first_word.startswith('#!') or first_word.startswith('<?'): # Shebang or PHP
                is_start = True
            elif first_word.startswith('{') or first_word.startswith('['): # JSON / Object
                is_start = True
            elif first_word.startswith('<'): # HTML / XML tags
                is_start = True
            elif first_word.endswith(':') and len(first_word) > 2: # Python definition end
                is_start = True
                
            if is_start:
                start = i
                end = i
                
                # Expand block until we hit a large gap or another strong top-level start
                # Heuristic: Keep going if lines are indented OR not empty OR seem related
                gap_count = 0
                max_gap = 2
                
                j = i + 1
                while j < len(lines):
                    if j in marked_lines:
                        break
                        
                    next_line = lines[j]
                    
                    if not next_line.strip():
                        gap_count += 1
                        if gap_count > max_gap:
                            break
                        j += 1
                        continue
                    
                    gap_count = 0
                    
                    # If line is not indented, check if it's a NEW top-level block
                    if not next_line.startswith(' ') and not next_line.startswith('\t'):
                        next_first = next_line.strip().split(' ')[0]
                        if next_first in START_KEYWORDS:
                             # It's a new block start, so end current one here
                             break
                    
                    end = j
                    j += 1
                
                if end - start >= 0: # Even single line imports are valid
                    # Include the gaps if they were part of the logic, but trim trailing empty lines
                    content = '\n'.join(lines[start:end+1]).strip()
                    if content:
                        blocks.append(CandidateBlock(content, start, end, 'keyword', 0.85, None))
                
                i = j
            else:
                i += 1
                
        return blocks

    def _extract_delimited_blocks(self, text: str) -> List[CandidateBlock]:
        blocks = []
        lines = text.split('\n')
        current_start = -1
        current_lang = None
        
        for i, line in enumerate(lines):
            match = self.SECTION_PATTERN.match(line.strip())
            if match:
                if current_start != -1:
                    end_line = i - 1
                    content = '\n'.join(lines[current_start+1:end_line+1]).strip()
                    if content:
                        blocks.append(CandidateBlock(content, current_start + 1, end_line, 'delimiter', 0.99, current_lang))
                current_start = i
                current_lang = match.group(1).lower()
        
        if current_start != -1:
            content = '\n'.join(lines[current_start+1:]).strip()
            if content:
                blocks.append(CandidateBlock(content, current_start + 1, len(lines)-1, 'delimiter', 0.99, current_lang))
        return blocks
    
    def _extract_markdown_blocks(self, text: str) -> List[CandidateBlock]:
        blocks = []
        lines = text.split('\n')
        in_block = False
        block_start = 0
        block_lines = []
        language_hint = None
        
        for i, line in enumerate(lines):
            fence_match = re.match(r'^```(\w+)?', line.strip())
            if fence_match and not in_block:
                in_block = True
                block_start = i
                language_hint = fence_match.group(1)
                block_lines = []
            elif line.strip().startswith('```') and in_block:
                if len(block_lines) >= self.min_block_lines:
                    blocks.append(CandidateBlock('\n'.join(block_lines), block_start + 1, i - 1, 'markdown', 0.95, language_hint))
                in_block = False
                block_lines = []
                language_hint = None
            elif in_block:
                block_lines.append(line)
        return blocks
    
    def _extract_indented_blocks(self, text: str, marked_lines: set) -> List[CandidateBlock]:
        blocks = []
        lines = text.split('\n')
        current_block = []
        block_start = None
        
        for i, line in enumerate(lines):
            if i in marked_lines:
                if current_block and len(current_block) >= self.min_block_lines:
                    blocks.append(CandidateBlock('\n'.join(current_block), block_start, i - 1, 'indentation', 0.75))
                current_block = []
                block_start = None
                continue
            
            indent = len(line) - len(line.lstrip())
            if line.strip() and (indent >= 4 or line.startswith('\t')):
                if not current_block: block_start = i
                current_block.append(line)
            else:
                if current_block and len(current_block) >= self.min_block_lines:
                    block_text = '\n'.join(current_block)
                    if self._calculate_technical_density(block_text) > 0.15:
                        blocks.append(CandidateBlock(block_text, block_start, i - 1, 'indentation', 0.85))
                current_block = []
                block_start = None
        return blocks
    
    def _extract_density_blocks(self, text: str, marked_lines: set) -> List[CandidateBlock]:
        blocks = []
        lines = text.split('\n')
        window_size = 5
        i = 0
        while i < len(lines) - window_size:
            if i in marked_lines:
                i += 1
                continue
            
            window_text = '\n'.join(lines[i:i+window_size])
            density = self._calculate_technical_density(window_text)
            
            if density > 0.15:
                start = i
                end = i + window_size
                while end < len(lines) and end not in marked_lines:
                    if self._calculate_technical_density(lines[end]) > 0.12: end += 1
                    else: break
                
                if end - start >= self.min_block_lines:
                    content = '\n'.join(lines[start:end])
                    if density > 0.30 or self._calculate_block_complexity(content) >= 3:
                        blocks.append(CandidateBlock(content, start, end - 1, 'density', min(0.60, density)))
                i = end
            else:
                i += 1
        return blocks
    
    def _calculate_technical_density(self, text: str) -> float:
        if not text.strip(): return 0.0
        tech_count = sum(1 for char in text if char in self.TECHNICAL_CHARS)
        words = text.split()
        keyword_count = sum(1 for word in words if word.lower() in self.KEYWORDS)
        return (tech_count / max(len(text), 1) * 0.7) + (keyword_count / max(len(words), 1) * 0.3)
    
    def _calculate_block_complexity(self, block: str) -> int:
        score = len(re.findall(r'\b(def|class|if|for|while|return)\b', block))
        if '{' in block and '}' in block: score += 1
        return score

    def _deduplicate_blocks(self, blocks: List[CandidateBlock]) -> List[CandidateBlock]:
        if not blocks: return []
        sorted_blocks = sorted(blocks, key=lambda b: b.confidence, reverse=True)
        kept = []
        used = set()
        for b in sorted_blocks:
            b_lines = set(range(b.start_line, b.end_line + 1))
            if not b_lines.intersection(used):
                kept.append(b)
                used.update(b_lines)
        return sorted(kept, key=lambda b: b.start_line)