"""
Filter - Precision Filter for False Positive Prevention
Filters out non-code blocks that passed initial segmentation.
"""
import re
from typing import Dict, List


class PrecisionFilter:
    """Filters false positives from validated blocks."""
    
    # Minimum thresholds
    MIN_LINES = 3
    MIN_CHARS = 30
    MIN_CONFIDENCE = 0.50
    
    # Inline variable pattern (short assignments without context)
    INLINE_VAR_PATTERN = r'^\s*\w+\s*=\s*.+$'
    
    # Natural language indicators (suggests prose, not code)
    PROSE_INDICATORS = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or',
        'but', 'however', 'therefore', 'this', 'that', 'these', 'those'
    }
    
    def __init__(self):
        """Initialize filter."""
        pass
    
    def should_accept_block(self, validation_result: Dict) -> Dict:
        """
        Determine if a validated block should be accepted.
        
        Args:
            validation_result: Result from Validator
            
        Returns:
            Dict with 'accept' bool and 'reason' string
        """
        content = validation_result['content']
        confidence = validation_result.get('confidence_score', 0.0)
        block_type = validation_result.get('block_type')
        language = validation_result.get('language')
        
        # Rule 1: Minimum confidence threshold
        if confidence < self.MIN_CONFIDENCE:
            return {
                'accept': False,
                'reason': f'Low confidence: {confidence:.2f} < {self.MIN_CONFIDENCE}',
                'filtered_by': 'confidence_threshold'
            }
        
        # Rule 2: Minimum size requirements
        lines = content.count('\n') + 1
        char_count = len(content.strip())
        
        if lines < self.MIN_LINES:
            return {
                'accept': False,
                'reason': f'Too few lines: {lines} < {self.MIN_LINES}',
                'filtered_by': 'minimum_lines'
            }
        
        if char_count < self.MIN_CHARS:
            return {
                'accept': False,
                'reason': f'Too short: {char_count} < {self.MIN_CHARS}',
                'filtered_by': 'minimum_chars'
            }
        
        # Rule 3: Inline variable assignment check (only for code blocks)
        if block_type == 'code' and lines < 5:
            if self._is_inline_variable(content):
                return {
                    'accept': False,
                    'reason': 'Inline variable assignment without context',
                    'filtered_by': 'inline_variable'
                }
        
        # Rule 4: Syntax integrity for code blocks
        if block_type == 'code':
            integrity_result = self._check_syntax_integrity(content)
            if not integrity_result['valid']:
                return {
                    'accept': False,
                    'reason': integrity_result['reason'],
                    'filtered_by': 'syntax_integrity'
                }
        
        # Rule 5: Prose detection (natural language masquerading as code)
        if block_type == 'code':
            if self._looks_like_prose(content):
                return {
                    'accept': False,
                    'reason': 'Content appears to be natural language prose',
                    'filtered_by': 'prose_detection'
                }
        
        # Rule 6: Context density check for low-confidence blocks
        if confidence < 0.75:
            density_result = self._check_context_density(content)
            if not density_result['sufficient']:
                return {
                    'accept': False,
                    'reason': density_result['reason'],
                    'filtered_by': 'context_density'
                }
        
        # Rule 7: Python Indentation Check
        if language == 'python' or self._looks_like_python(content):
            if not self._check_indentation(content):
                return {
                    'accept': False,
                    'reason': 'Invalid or mixed indentation',
                    'filtered_by': 'indentation_check'
                }

        # All checks passed
        return {
            'accept': True,
            'reason': 'Passed all precision filters',
            'filtered_by': None
        }
    
    def _is_inline_variable(self, content: str) -> bool:
        """Check if content is just an inline variable assignment."""
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        # Single line variable assignments
        if len(lines) == 1:
            return bool(re.match(self.INLINE_VAR_PATTERN, lines[0]))
        
        # Multiple simple assignments without structure
        if len(lines) <= 3:
            assignment_count = sum(
                1 for line in lines
                if re.match(self.INLINE_VAR_PATTERN, line)
            )
            # If all lines are simple assignments, likely not real code
            if assignment_count == len(lines):
                return True
        
        return False
    
    def _check_syntax_integrity(self, content: str) -> Dict:
        """
        Check syntax integrity:
        - Balanced brackets/parentheses
        - Balanced quotes
        - Proper block structure
        """
        # Check bracket balance
        brackets = {'(': ')', '[': ']', '{': '}'}
        stack = []
        
        for char in content:
            if char in brackets:
                stack.append(char)
            elif char in brackets.values():
                if not stack:
                    return {
                        'valid': False,
                        'reason': f'Unmatched closing bracket: {char}'
                    }
                if brackets[stack.pop()] != char:
                    return {
                        'valid': False,
                        'reason': 'Mismatched brackets'
                    }
        
        if stack:
            return {
                'valid': False,
                'reason': f'Unclosed brackets: {stack}'
            }
        
        # Check quote balance
        single_quotes = content.count("'")
        double_quotes = content.count('"')
        
        if single_quotes % 2 != 0 or double_quotes % 2 != 0:
            return {
                'valid': False,
                'reason': 'Unmatched quotes'
            }
        
        return {'valid': True}
    
    def _check_indentation(self, content: str) -> bool:
        """Check for consistent indentation (no mixed tabs/spaces)."""
        lines = content.split('\n')
        # Check for mixed tabs/spaces
        has_tabs = any('\t' in line for line in lines)
        has_spaces = any(line.startswith(' ') for line in lines)
        
        if has_tabs and has_spaces:
            return False  # Mixed indentation
        
        return True

    def _looks_like_python(self, content: str) -> bool:
        """Heuristic to check if content looks like Python."""
        keywords = {'def', 'class', 'import', 'from', 'if', 'elif', 'else', 'try', 'except'}
        words = set(re.findall(r'\b\w+\b', content))
        return bool(words.intersection(keywords)) and ':' in content
    
    def _looks_like_prose(self, content: str) -> bool:
        """
        Detect if content is natural language prose rather than code.
        Uses word frequency analysis.
        """
        words = re.findall(r'\b\w+\b', content.lower())
        
        if not words:
            return False
        
        # Count prose indicators
        prose_word_count = sum(1 for word in words if word in self.PROSE_INDICATORS)
        prose_ratio = prose_word_count / len(words)
        
        # If > 20% of words are common prose words, likely natural language
        if prose_ratio > 0.20:
            return True
        
        # Check for sentence-like structures (capital letters after periods)
        sentence_pattern = r'\.\s+[A-Z]'
        sentence_count = len(re.findall(sentence_pattern, content))
        
        # Multiple sentences suggest prose
        if sentence_count > 2:
            return True
        
        return False
    
    def _check_context_density(self, content: str) -> Dict:
        """
        Check if content has sufficient technical context.
        For low-confidence blocks, we need more evidence.
        """
        # Count technical indicators
        technical_chars = set('{}[]()<>;:=')
        tech_char_count = sum(1 for char in content if char in technical_chars)
        
        total_chars = len(content)
        if total_chars == 0:
            return {'sufficient': False, 'reason': 'Empty content'}
        
        tech_density = tech_char_count / total_chars
        
        # Require at least 5% technical characters for low-confidence blocks
        if tech_density < 0.05:
            return {
                'sufficient': False,
                'reason': f'Low technical density: {tech_density:.2%}'
            }
        
        return {'sufficient': True}
    
    def batch_filter(self, validation_results: List[Dict]) -> List[Dict]:
        """
        Filter a batch of validation results.
        
        Args:
            validation_results: List of validation result dicts
            
        Returns:
            Filtered list (only accepted blocks)
        """
        accepted = []
        
        for result in validation_results:
            filter_result = self.should_accept_block(result)
            
            if filter_result['accept']:
                # Add filter metadata
                result['filter_passed'] = True
                accepted.append(result)
            else:
                # Optionally log rejected blocks for debugging
                result['filter_passed'] = False
                result['rejection_reason'] = filter_result['reason']
                result['filtered_by'] = filter_result['filtered_by']
        
        return accepted
