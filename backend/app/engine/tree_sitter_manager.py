"""
Tree-sitter Manager - Language Grammar Loader
Manages Tree-sitter language parsers for AST validation.
"""
from pathlib import Path
from typing import Dict, Optional
from tree_sitter import Language, Parser


class TreeSitterManager:
    """Manages Tree-sitter language parsers."""
    
    # Singleton instance
    _instance = None
    
    SUPPORTED_LANGUAGES = {
        'python', 'javascript', 'typescript', 'java',
        'c', 'cpp', 'go', 'rust',
        'ruby', 'php', 'c_sharp', 'swift', 'kotlin', 'bash', 'tsx'
    }
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize manager."""
        if self._initialized:
            return
        
        self.grammar_dir = Path(__file__).parent.parent.parent / "grammars"
        self.languages: Dict[str, Language] = {}
        self.parsers: Dict[str, Parser] = {}
        self._initialized = True
    
    def load_language(self, language: str) -> Optional[Language]:
        """
        Load a language grammar (lazy loading).
        
        Args:
            language: Language name (e.g., 'python')
            
        Returns:
            Language object or None if failed
        """
        if language not in self.SUPPORTED_LANGUAGES:
            return None
        
        # Return cached if already loaded
        if language in self.languages:
            return self.languages[language]
        
        try:
            import ctypes
            grammar_path = self.grammar_dir / f"{language}.so"
            
            if not grammar_path.exists():
                print(f"Warning: Grammar not found for {language} at {grammar_path}")
                return None
            
            # Load library
            lib = ctypes.cdll.LoadLibrary(str(grammar_path))
            
            # Get language function
            # Convention: tree_sitter_{language}
            func_name = f"tree_sitter_{language}"
            
            # Special handling for C#
            if language == 'c_sharp':
                func_name = "tree_sitter_c_sharp"
            elif language == 'tsx':
                 # TSX is compiled into typescript.so but has a different entry point
                 grammar_path = self.grammar_dir / "typescript.so"
                 func_name = "tree_sitter_tsx"
            
            try:
                func = getattr(lib, func_name)
            except AttributeError:
                # Fallback for some languages that might use diff naming
                print(f"Warning: Function {func_name} not found in {grammar_path}")
                return None
            
            # Get pointer
            func.restype = ctypes.c_void_p
            ptr = func()
            
            try:
                lang = Language(ptr, language)
            except TypeError:
                # Fallback for older tree-sitter versions
                lang = Language(ptr)
                
            self.languages[language] = lang
            
            return lang
        
        except Exception as e:
            print(f"Error loading {language} grammar: {e}")
            return None
    
    def get_parser(self, language: str) -> Optional[Parser]:
        """
        Get a parser for a language (lazy loading).
        
        Args:
            language: Language name
            
        Returns:
            Parser object or None
        """
        if language not in self.SUPPORTED_LANGUAGES:
            return None
        
        # Return cached parser
        if language in self.parsers:
            return self.parsers[language]
        
        # Load grammar first
        lang = self.load_language(language)
        if not lang:
            return None
        
        try:
            parser = Parser(lang)
            self.parsers[language] = parser
            
            return parser
        
        except Exception as e:
            print(f"Error creating parser for {language}: {e}")
            return None
    
    def validate_syntax(self, code: str, language: str) -> Dict:
        """
        Validate code syntax using Tree-sitter AST.
        
        Args:
            code: Source code string
            language: Programming language
            
        Returns:
            Dict with 'valid', 'tree', 'errors'
        """
        parser = self.get_parser(language)
        
        if not parser:
            return {
                'valid': False,
                'tree': None,
                'errors': [f'Parser not available for {language}']
            }
        
        try:
            # Parse the code
            tree = parser.parse(bytes(code, 'utf-8'))
            root = tree.root_node
            
            # Check for syntax errors
            has_errors = root.has_error
            
            # Extract error nodes
            errors = []
            if has_errors:
                errors = self._extract_errors(root)
            
            return {
                'valid': not has_errors,
                'tree': tree,
                'root_node': root,
                'errors': errors,
                'node_count': self._count_nodes(root)
            }
        
        except Exception as e:
            return {
                'valid': False,
                'tree': None,
                'errors': [str(e)]
            }
    
    def _extract_errors(self, node) -> list:
        """Recursively extract error nodes."""
        errors = []
        
        if node.type == 'ERROR' or node.is_missing:
            errors.append({
                'type': node.type,
                'start': node.start_point,
                'end': node.end_point
            })
        
        for child in node.children:
            errors.extend(self._extract_errors(child))
        
        return errors
    
    def _count_nodes(self, node) -> int:
        """Count total nodes in AST."""
        count = 1
        for child in node.children:
            count += self._count_nodes(child)
        return count
    
    def check_balanced_brackets(self, code: str) -> bool:
        """
        Check if brackets/parentheses are balanced.
        
        Args:
            code: Source code
            
        Returns:
            True if balanced
        """
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        
        for char in code:
            if char in pairs:
                stack.append(char)
            elif char in pairs.values():
                if not stack:
                    return False
                if pairs[stack.pop()] != char:
                    return False
        
        return len(stack) == 0
