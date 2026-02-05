"""
Validator - Core Validation Engine
Validates candidate blocks using Tree-sitter AST and pattern matching.
"""
import re
import json
import yaml
import xml.etree.ElementTree as ET
from typing import Dict, Optional
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
        self.scoring_adjustments = {}
    
    def validate_block(self, block: CandidateBlock, filename: str = None) -> Dict:
        """
        Validate and classify a candidate block.
        """
        result = {
            'content': block.content,
            'start_line': block.start_line,
            'end_line': block.end_line,
            'detection_method': block.detection_method,
            'block_type': None,
            'language': None,
            'confidence_score': block.confidence, # Start with segmenter confidence
            'validation_method': None,
            'valid': False
        }
        
        # Determine language hint from extension
        extension_hint = None
        if filename:
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            ext_map = {
                'py': 'python', 'js': 'javascript', 'jsx': 'javascript', 
                'ts': 'typescript', 'tsx': 'tsx',
                'java': 'java', 'c': 'c', 'cpp': 'cpp', 'cc': 'cpp',
                'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby',
                'cs': 'c_sharp', 'sh': 'bash', 'bash': 'bash', 'zsh': 'bash',
                'kt': 'kotlin', 'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
                'md': 'markdown'
            }
            extension_hint = ext_map.get(ext)

        
        # 1. Try explicit language hint from block (Markdown fence)
        if block.language_hint:
            lang_result = self._validate_programming_language(
                block.content, 
                block.language_hint
            )
            if lang_result['valid']:
                result.update(lang_result)
                result['block_type'] = 'code'
                result['validation_method'] = 'tree-sitter-hint'
                return result
        
        # 2. PRIORITY: Content-based automatic detection (overrides extension)
        # This catches cases like HTML in a .txt file
        lang_result = self._detect_programming_language(block.content)
        if lang_result['valid'] and lang_result.get('confidence_score', 0) > 0.75:
            result.update(lang_result)
            result['block_type'] = 'code'
            result['validation_method'] = 'tree-sitter-auto-priority'
            return result
        
        # 3. Try file extension hint (only if auto-detection didn't find anything strong)
        if extension_hint:
            if extension_hint == 'markdown':
                result['valid'] = True
                result['language'] = 'markdown'
                result['block_type'] = 'markup'
                result['confidence_score'] = 0.90
                result['validation_method'] = 'extension'
                return result

            if extension_hint in ['json', 'xml', 'yaml']:
                 structured_result = self._validate_structured_data(block.content)
                 if structured_result['valid'] and structured_result['language'] == extension_hint:
                     result.update(structured_result)
                     result['block_type'] = 'structured'
                     result['confidence_score'] = 0.99
                     return result
            else:
                lang_result = self._validate_programming_language(block.content, extension_hint)
                if lang_result['valid']:
                    result.update(lang_result)
                    result['block_type'] = 'code'
                    result['validation_method'] = 'tree-sitter-context'
                    result['confidence_score'] = min(0.99, result['confidence_score'] + 0.15)
                    return result

        # 4. Fallback: Try auto-detection again with lower threshold
        if not lang_result.get('valid'):
            lang_result = self._detect_programming_language(block.content)
        if lang_result['valid']:
            result.update(lang_result)
            result['block_type'] = 'code'
            result['validation_method'] = 'tree-sitter-auto'
            return result
        
        # 5. Try structured data
        structured_result = self._validate_structured_data(block.content)
        if structured_result['valid']:
            result.update(structured_result)
            result['block_type'] = 'structured'
            return result
        
        # 6. Config patterns
        config_result = self._validate_config(block.content)
        if config_result['valid']:
            result.update(config_result)
            result['block_type'] = 'config'
            return result
        
        # 7. Log patterns
        log_result = self._validate_log(block.content)
        if log_result['valid']:
            result.update(log_result)
            result['block_type'] = 'log'
            return result
        
        # Failed to validate
        result['confidence_score'] = block.confidence * 0.5
        return result
    
    def _validate_programming_language(self, code: str, language: str) -> Dict:
        """Validate code using Tree-sitter."""
        lang_map = {
            'py': 'python', 'js': 'javascript', 'ts': 'typescript',
            'c++': 'cpp', 'cs': 'c_sharp', 'rb': 'ruby',
            'sh': 'bash', 'zsh': 'bash', 'kt': 'kotlin'
        }
        language = lang_map.get(language.lower(), language.lower())
        
        ts_result = self.ts_manager.validate_syntax(code, language)
        
        if ts_result['valid']:
            node_count = ts_result.get('node_count', 0)
            base_confidence = 0.90
            complexity_bonus = min(0.09, node_count / 500)
            confidence = min(0.99, base_confidence + complexity_bonus)
            
            if not self.ts_manager.check_balanced_brackets(code):
                confidence -= 0.15
            
            return {
                'valid': True,
                'language': language,
                'confidence_score': confidence,
                'ast_nodes': node_count
            }
        return {'valid': False}
    
    def _detect_programming_language(self, code: str) -> Dict:
        candidate_langs = ['python', 'javascript', 'java', 'go', 'bash', 'php', 'ruby']
        best_result = {'valid': False, 'confidence_score': 0.0}
        
        for lang in candidate_langs:
            result = self._validate_programming_language(code, lang)
            if lang == 'bash' and code.startswith('#!'):
                 result['valid'] = True
                 result['language'] = 'bash'
                 result['confidence_score'] = 1.0
            
            if result['valid'] and result.get('confidence_score', 0) > best_result.get('confidence_score', 0):
                best_result = result
        return best_result

    def _validate_structured_data(self, content: str) -> Dict:
        try:
            json.loads(content)
            return {'valid': True, 'language': 'json', 'confidence_score': 0.98, 'validation_method': 'schema'}
        except: pass
        
        try:
            yaml.safe_load(content)
            # YAML can match simple strings, be stricter
            if ':' in content and '\n' in content:
                return {'valid': True, 'language': 'yaml', 'confidence_score': 0.95, 'validation_method': 'schema'}
        except: pass
        
        try:
            ET.fromstring(content)
            return {'valid': True, 'language': 'xml', 'confidence_score': 0.96, 'validation_method': 'schema'}
        except: pass
        return {'valid': False}

    def _validate_config(self, content: str) -> Dict:
        cisco_matches = sum(1 for p in self.CISCO_PATTERNS.values() if re.search(p, content, re.M | re.I))
        if cisco_matches >= 2:
            return {'valid': True, 'language': 'cisco_ios', 'confidence_score': 0.85, 'validation_method': 'pattern'}
            
        nginx_matches = sum(1 for p in self.NGINX_PATTERNS.values() if re.search(p, content, re.M))
        if nginx_matches >= 2:
            return {'valid': True, 'language': 'nginx', 'confidence_score': 0.85, 'validation_method': 'pattern'}
        return {'valid': False}

    def _validate_log(self, content: str) -> Dict:
        matches = {k: len(re.findall(p, content, re.M | re.I)) for k, p in self.LOG_PATTERNS.items()}
        if matches['timestamp'] > 0 and matches['severity'] > 0:
            return {'valid': True, 'language': 'log', 'confidence_score': 0.80, 'validation_method': 'pattern'}
        return {'valid': False}