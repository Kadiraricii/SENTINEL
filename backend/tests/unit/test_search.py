from datetime import datetime
from app.models import FileMetadata, ExtractedBlock

def test_search_basic(client, db):
    # Setup data
    f1 = FileMetadata(filename="search_test.py", original_filename="search_test.py", file_type="py", file_size=10, file_hash="hash")
    db.add(f1)
    db.commit()
    
    b1 = ExtractedBlock(file_id=f1.id, content="def important_function(): pass", language="python", confidence_score=0.9, block_type="code")
    b2 = ExtractedBlock(file_id=f1.id, content="console.log('hello')", language="javascript", confidence_score=0.5, block_type="code")
    db.add(b1)
    db.add(b2)
    db.commit()
    
    # Search by text
    resp = client.get("/api/search?q=important")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] == 1
    assert data["results"][0]["content"] == "def important_function(): pass"
    
    # Search by language
    resp = client.get("/api/search?languages=javascript")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] == 1
    assert data["results"][0]["language"] == "javascript"
    
    # Search by confidence
    resp = client.get("/api/search?min_confidence=0.8")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] == 1
    assert data["results"][0]["confidence_score"] >= 0.8
