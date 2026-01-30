
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.engine.normalizer import FileNormalizer
from app.engine.segmenter import Segmenter
from app.engine.filter import PrecisionFilter

def test_validation_engine():
    print("🧪 Testing Enhanced Validation Engine...")
    
    # 1. Test Normalizer
    print("\n[1] Testing Normalizer")
    normalizer = FileNormalizer()
    text_with_issues = "Hello\u200bWorld" # Zero width space
    normalized = normalizer._normalize_text(text_with_issues)
    if "HelloWorld" == normalized:
        print("✅ Zero-width removal works")
    else:
        print(f"❌ Zero-width removal failed: {normalized!r}")

    # 2. Test Segmenter
    print("\n[2] Testing Segmenter (Density & Complexity)")
    segmenter = Segmenter()
    
    # Low complexity code (should be ignored by density chack due to complexity < 3)
    simple_code = """
    x = 1
    y = 2
    z = x + y
    """
    
    # High complexity code
    complex_code = """
    def calculate_sum(a, b):
        if a > b:
            return a + b
        else:
            return b - a
    """
    
    blocks_simple = segmenter.segment(simple_code)
    blocks_complex = segmenter.segment(complex_code)
    
    print(f"Simple code blocks found: {len(blocks_simple)} (Expected: 0 or few low confidence)")
    print(f"Complex code blocks found: {len(blocks_complex)} (Expected: 1)")
    
    if len(blocks_complex) > 0:
         print("✅ Complexity check passed for complex code")
    
    # 3. Test Filter
    print("\n[3] Testing Precision Filter")
    precision_filter = PrecisionFilter()
    
    # Good Python code
    good_python = """
    def test():
        print("Hello")
        return True
    """
    
    # Bad indentation Python
    bad_python = """
    def test():
      print("Hello")
    \treturn False
    """
    
    res_good = precision_filter.should_accept_block({
        'content': good_python,
        'confidence_score': 0.9,
        'block_type': 'code',
        'language': 'python'
    })
    
    res_bad = precision_filter.should_accept_block({
        'content': bad_python,
        'confidence_score': 0.9,
        'block_type': 'code',
        'language': 'python'
    })
    
    if res_good['accept']:
        print("✅ Good Python accepted")
    else:
        print(f"❌ Good Python rejected: {res_good['reason']}")
        
    if not res_bad['accept']:
        print(f"✅ Bad Python rejected: {res_bad['reason']}")
    else:
        print("❌ Bad Python accepted")

if __name__ == "__main__":
    test_validation_engine()
