"""Database configuration and session management."""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
# For Supabase, we need to construct the proper PostgreSQL connection string
# Format: postgresql://postgres:[password]@[host]:[port]/postgres
DATABASE_URL = f"postgresql://postgres.{settings.supabase_url.split('//')[1].split('.')[0]}:{settings.supabase_db_password}@aws-1-ca-central-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

