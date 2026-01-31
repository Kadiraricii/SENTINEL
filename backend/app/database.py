"""
Database configuration and session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# Database file location
# Resolve to absolute path to avoid issues with relative imports
DATABASE_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATABASE_DIR.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite:///{DATABASE_DIR}/hpes.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# SQLite REGEXP implementation
def regexp(expr, item):
    reg = re.compile(expr)
    return reg.search(item) is not None

def get_db():
    """Dependency for FastAPI routes to get database session."""
    db = SessionLocal()
    try:
        # Register REGEXP function for SQLite
        if "sqlite" in str(engine.url):
            engine.raw_connection().create_function("REGEXP", 2, regexp)
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from app.models import ExtractedBlock, UserFeedback, FileMetadata
    Base.metadata.create_all(bind=engine)
