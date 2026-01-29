#!/usr/bin/env python3
"""
Tree-sitter Grammar Builder
Automatically clones and builds grammar files for supported languages.
"""
import os
import subprocess
from pathlib import Path

GRAMMARS = {
    "python": "https://github.com/tree-sitter/tree-sitter-python",
    "javascript": "https://github.com/tree-sitter/tree-sitter-javascript",
    "typescript": "https://github.com/tree-sitter/tree-sitter-typescript",
    "java": "https://github.com/tree-sitter/tree-sitter-java",
    "c": "https://github.com/tree-sitter/tree-sitter-c",
    "cpp": "https://github.com/tree-sitter/tree-sitter-cpp",
    "go": "https://github.com/tree-sitter/tree-sitter-go",
    "rust": "https://github.com/tree-sitter/tree-sitter-rust",
}

GRAMMAR_DIR = Path(__file__).parent.parent / "grammars"


def build_grammar(name: str, repo_url: str):
    """Clone and build a single grammar."""
    print(f"Building grammar: {name}")
    
    grammar_path = GRAMMAR_DIR / name
    
    # Clone if not exists
    if not grammar_path.exists():
        print(f"  Cloning {repo_url}...")
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(grammar_path)],
            check=True,
            capture_output=True
        )
    
    # Build the grammar (Tree-sitter will compile .so/.dll files)
    print(f"  Building {name}...")
    try:
        from tree_sitter import Language
        
        # Special handling for TypeScript (has multiple languages)
        if name == "typescript":
            Language.build_library(
                str(GRAMMAR_DIR / f"{name}.so"),
                [str(grammar_path / "typescript"), str(grammar_path / "tsx")]
            )
        else:
            Language.build_library(
                str(GRAMMAR_DIR / f"{name}.so"),
                [str(grammar_path)]
            )
        print(f"  ✓ {name} built successfully")
    except Exception as e:
        print(f"  ✗ Failed to build {name}: {e}")


def main():
    """Build all grammars."""
    print("Tree-sitter Grammar Builder")
    print("=" * 50)
    
    GRAMMAR_DIR.mkdir(exist_ok=True)
    
    for name, repo_url in GRAMMARS.items():
        try:
            build_grammar(name, repo_url)
        except Exception as e:
            print(f"Error building {name}: {e}")
            continue
    
    print("\n" + "=" * 50)
    print("Grammar build complete!")


if __name__ == "__main__":
    main()
