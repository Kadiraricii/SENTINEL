"""
Validator - Core Validation Engine
Validates candidate blocks using Tree-sitter AST and pattern matching.
"""
import re
import json
import yaml
import xml.etree.ElementTree as ET
from typing import Dict, Optional
from datetime import datetime

from app.engine.tree_sitter_manager import TreeSitterManager
from app.engine.segmenter import CandidateBlock


class Validator:
    """Validates and classifies extracted blocks."""
    
    # Config format patterns
    CISCO_PATTERNS = {
        'access-list': r'access-list\s+\d+\s+(permit|deny)',
        'vlan': r'vlan\s+\d+',
        'interface': r'interface\s+\w+',
        'ip': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',  # IPv4
        'router': r'router\s+(bgp|ospf|eigrp)',
    }
    
    NGINX_PATTERNS = {
        'server_block': r'server\s*\{',
        'location': r'location\s+[~*^]*\s*[\w/]+\s*\{',
        'listen': r'listen\s+\d+',
        'proxy': r'proxy_pass\s+https?://',
    }
    
    LOG_PATTERNS = {
        'timestamp': r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}',
        'severity': r'\b(DEBUG|INFO|WARN|WARNING|ERROR|ERR|CRITICAL|FATAL)\b',
        'ip_address': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
    }
    
    def __init__(self):
        """Initialize validator."""
        self.ts_manager = TreeSitterManager()
        
        # Feedback-based scoring adjustments (initially empty)
        # This would be populated from database in production
        self.scoring_adjustments = {}
    
    def validate_block(self, block: CandidateBlock, filename: str = None) -> Dict:
        """
        Validate and classify a candidate block.
        
        Args:
            block: CandidateBlock to validate
            filename: Optional filename to provide context (e.g., extension hints)
            
        Returns:
            Validation result dict
        """
        result = {
            'content': block.content,
            'start_line': block.start_line,
            'end_line': block.end_line,
            'detection_method': block.detection_method,
            'block_type': None,
            'language': None,
            'confidence_score': 0.0,
            'validation_method': None,
            'valid': False
        }
        
        # Determine language hint from extension
        extension_hint = None
        if filename:
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            # Map extensions to languages
            ext_map = {
                'py': 'python', 'js': 'javascript', 'jsx': 'javascript', 
                'ts': 'typescript', 'tsx': 'typescript',
                'java': 'java', 'c': 'c', 'cpp': 'cpp', 'cc': 'cpp',
                'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby',
                'cs': 'c_sharp', 'sh': 'bash', 'bash': 'bash', 'zsh': 'bash',
                'kt': 'kotlin', 'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
                'md': 'markdown'
            }
            extension_hint = ext_map.get(ext)

        # 1. Try explicit language hint from block (Markdown fence) - Highest Priority
        if block.language_hint:
            # Markdown specified a language
            lang_result = self._validate_programming_language(
                block.content, 
                block.language_hint
            )
            if lang_result['valid']:
                result.update(lang_result)
                result['block_type'] = 'code'
                result['validation_method'] = 'tree-sitter-hint'
                return result
        
        # 2. Try file extension hint - High Priority
        if extension_hint:
            # Try to validate using the file's native language first
            if extension_hint in ['json', 'xml', 'yaml']:
                 structured_result = self._validate_structured_data(block.content)
                 if structured_result['valid'] and structured_result['language'] == extension_hint:
                     result.update(structured_result)
                     result['block_type'] = 'structured'
                     # Boost confidence
                     result['confidence_score'] = min(0.99, result['confidence_score'] + 0.1)
                     return result
            else:
                # It's a code language
                lang_result = self._validate_programming_language(block.content, extension_hint)
                if lang_result['valid']:
                    result.update(lang_result)
                    result['block_type'] = 'code'
                    result['validation_method'] = 'tree-sitter-context'
                    # Boost confidence significantly
                    result['confidence_score'] = min(0.99, result['confidence_score'] + 0.15)
                    return result

        # 3. Fallback: Try all supported programming languages (Automatic Detection)
        lang_result = self._detect_programming_language(block.content)
        if lang_result['valid']:
            result.update(lang_result)
            result['block_type'] = 'code'
            result['validation_method'] = 'tree-sitter-auto'
            return result
        
        # 4. Try structured data validation (Generic)
        structured_result = self._validate_structured_data(block.content)
        if structured_result['valid']:
            result.update(structured_result)
            result['block_type'] = 'structured'
            return result
        
        # 5. Try config patterns
        config_result = self._validate_config(block.content)
        if config_result['valid']:
            result.update(config_result)
            result['block_type'] = 'config'
            return result
        
        # 6. Try log patterns
        log_result = self._validate_log(block.content)
        if log_result['valid']:
            result.update(log_result)
            result['block_type'] = 'log'
            return result
        
        # Unable to validate
        result['confidence_score'] = block.confidence * 0.5  # Reduce confidence
        return result
    
    def _validate_programming_language(self, code: str, language: str) -> Dict:
        """Validate code using Tree-sitter for specific language."""
        # Normalize language name
        lang_map = {
            'py': 'python',
            'js': 'javascript',
            'ts': 'typescript',
            'c++': 'cpp',
            'cs': 'c_sharp',
            'rb': 'ruby',
            'sh': 'bash',
            'zsh': 'bash',
            'kt': 'kotlin',
        }
        language = lang_map.get(language.lower(), language.lower())
        
        # Validate with Tree-sitter
        ts_result = self.ts_manager.validate_syntax(code, language)
        
        if ts_result['valid']:
            # Calculate confidence based on AST complexity
            node_count = ts_result.get('node_count', 0)
            base_confidence = 0.95
            
            # Higher node count = more complex = higher confidence
            complexity_bonus = min(0.04, node_count / 1000)
            confidence = min(0.99, base_confidence + complexity_bonus)
            
            # Check syntax integrity
            if not self.ts_manager.check_balanced_brackets(code):
                confidence -= 0.10
            
            return {
                'valid': True,
                'language': language,
                'confidence_score': confidence,
                'ast_nodes': node_count
            }
        
        return {'valid': False}
    
    def _detect_programming_language(self, code: str) -> Dict:
        """Try to detect programming language automatically."""
        # Try common languages in order of likelihood
        candidate_langs = ['python', 'javascript', 'java', 'c', 'cpp', 'go', 'rust', 'c_sharp', 'php', 'kotlin', 'bash', 'ruby']
        
        best_result = {'valid': False, 'confidence_score': 0.0}
        
        for lang in candidate_langs:
            result = self._validate_programming_language(code, lang)
            
            # Special handling for SHEBANG
            if lang == 'bash' and code.startswith('#!'):
                 result['valid'] = True
                 result['language'] = 'bash'
                 result['confidence_score'] = 1.0

            if result['valid'] and result.get('confidence_score', 0) > best_result.get('confidence_score', 0):
                best_result = result
        
        return best_result
    
    def _validate_structured_data(self, content: str) -> Dict:
        """Validate JSON, YAML, XML, TOML."""
        # Try JSON
        try:
            json.loads(content)
            return {
                'valid': True,
                'language': 'json',
                'confidence_score': 0.98,
                'validation_method': 'schema'
            }
        except:
            pass
        
        # Try YAML
        try:
            yaml.safe_load(content)
            return {
                'valid': True,
                'language': 'yaml',
                'confidence_score': 0.97,
                'validation_method': 'schema'
            }
        except:
            pass
        
        # Try XML
        try:
            ET.fromstring(content)
            return {
                'valid': True,
                'language': 'xml',
                'confidence_score': 0.96,
                'validation_method': 'schema'
            }
        except:
            pass
        
        return {'valid': False}
    
    def _validate_config(self, content: str) -> Dict:
        """Validate network/server configs using pattern matching."""
        # Check Cisco patterns
        cisco_matches = sum(
            1 for pattern in self.CISCO_PATTERNS.values()
            if re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        )
        
        if cisco_matches >= 2:  # At least 2 Cisco patterns
            confidence = min(0.85, 0.70 + (cisco_matches * 0.05))
            return {
                'valid': True,
                'language': 'cisco_ios',
                'confidence_score': confidence,
                'validation_method': 'pattern_matching',
                'matched_patterns': cisco_matches
            }
        
        # Check Nginx patterns
        nginx_matches = sum(
            1 for pattern in self.NGINX_PATTERNS.values()
            if re.search(pattern, content, re.MULTILINE)
        )
        
        if nginx_matches >= 2:
            confidence = min(0.85, 0.70 + (nginx_matches * 0.05))
            return {
                'valid': True,
                'language': 'nginx',
                'confidence_score': confidence,
                'validation_method': 'pattern_matching',
                'matched_patterns': nginx_matches
            }
        
        return {'valid': False}
    
    def _validate_log(self, content: str) -> Dict:
        """Validate log files based on timestamp and severity patterns."""
        matches = {}
        
        for key, pattern in self.LOG_PATTERNS.items():
            matches[key] = len(re.findall(pattern, content, re.MULTILINE | re.IGNORECASE))
        
        # Must have timestamps and severity levels
        if matches['timestamp'] > 0 and matches['severity'] > 0:
            # Calculate confidence based on pattern density
            lines = content.count('\n') + 1
            density = (matches['timestamp'] + matches['severity']) / (lines * 2)
            confidence = min(0.90, 0.60 + (density * 0.30))
            
            return {
                'valid': True,
                'language': 'log',
                'confidence_score': confidence,
                'validation_method': 'pattern_matching',
                'log_patterns': matches
            }
        
        return {'valid': False}
    
    def apply_feedback_adjustment(self, result: Dict, feedback_history: list) -> Dict:
        """
        Adjust confidence score based on user feedback history.
        
        Args:
            result: Validation result
            feedback_history: List of feedback dicts for similar blocks
            
        Returns:
            Updated result with adjusted confidence
        """
        if not feedback_history:
            return result
        
        # Calculate acceptance rate for this language/type
        accepted = sum(1 for fb in feedback_history if fb['action'] == 'accept')
        total = len(feedback_history)
        acceptance_rate = accepted / total
        
        # Adjust confidence
        if acceptance_rate > 0.8:
            # High acceptance - boost confidence
            result['confidence_score'] = min(0.99, result['confidence_score'] * 1.10)
        elif acceptance_rate < 0.5:
            # Low acceptance - reduce confidence
            result['confidence_score'] *= 0.85
        
        return result
