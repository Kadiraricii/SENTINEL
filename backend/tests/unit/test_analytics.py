from datetime import datetime
from app.models import FileMetadata, ExtractedBlock, Session, ExtractionStats

def test_get_analytics_overview_empty(client):
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 0
    assert data["total_blocks"] == 0

def test_get_analytics_with_data(client, db):
    # Create test data
    file = FileMetadata(
        filename="test.py", original_filename="test.py", 
        file_type="py", file_size=100, file_hash="abc",
        upload_date=datetime.utcnow()
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    
    block = ExtractedBlock(
        file_id=file.id, content="def test(): pass", 
        language="python", confidence_score=0.95,
        block_type="code"
    )
    db.add(block)
    db.commit()
    
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 1
    assert data["total_blocks"] == 1
    assert data["avg_confidence"] == 0.95
    assert len(data["language_distribution"]) == 1
    assert data["language_distribution"][0]["language"] == "python"

def test_get_top_files(client, db):
    # File 1 with 2 blocks
    f1 = FileMetadata(filename="f1.py", original_filename="f1.py", file_type="py", file_size=10, file_hash="1")
    db.add(f1)
    db.commit()
    db.add(ExtractedBlock(file_id=f1.id, content="b1", language="python", confidence_score=1.0, block_type="code"))
    db.add(ExtractedBlock(file_id=f1.id, content="b2", language="python", confidence_score=1.0, block_type="code"))
    
    # File 2 with 1 block
    f2 = FileMetadata(filename="f2.js", original_filename="f2.js", file_type="js", file_size=10, file_hash="2")
    db.add(f2)
    db.commit()
    db.add(ExtractedBlock(file_id=f2.id, content="b3", language="javascript", confidence_score=1.0, block_type="code"))
    db.commit()
    
    response = client.get("/api/analytics/top-files")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["filename"] == "f1.py"
    assert data[0]["block_count"] == 2
