"""Database configuration and session management."""

import logging
from contextlib import contextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, DisconnectionError
from app.config import settings
from typing import Generator, Optional
import time

# Set up logging
logger = logging.getLogger(__name__)

# Base declarative class
Base = declarative_base()

# Global engine and session factory
engine = None
SessionLocal = None


def construct_database_url() -> str:
    """Construct database URL with proper error handling."""
    # Use explicit database URL if provided
    if settings.database_url:
        logger.info("Using explicit database URL from configuration")
        return settings.database_url
    
    try:
        if settings.supabase_url and "supabase.co" in settings.supabase_url:
            # Extract project reference from URL like https://xyz.supabase.co
            url_parts = settings.supabase_url.replace("https://", "").replace("http://", "")
            project_ref = url_parts.split('.')[0]
            
            # Construct Supabase connection string
            # Format: postgresql://postgres.project_ref:password@aws-0-region.pooler.supabase.com:6543/postgres
            DATABASE_URL = f"postgresql://postgres.{project_ref}:{settings.supabase_db_password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
            logger.info(f"Using Supabase database for project: {project_ref}")
            return DATABASE_URL
        else:
            # Fallback to local database for development
            DATABASE_URL = "postgresql://postgres:password@localhost:5432/tradelab"
            logger.info("Using local PostgreSQL database")
            return DATABASE_URL
            
    except Exception as e:
        logger.error(f"Error constructing database URL: {e}")
        # Final fallback to local database
        DATABASE_URL = "postgresql://postgres:password@localhost:5432/tradelab"
        logger.warning("Using fallback local database URL")
        return DATABASE_URL


def create_database_engine():
    """Create database engine with proper configuration."""
    global engine
    
    DATABASE_URL = construct_database_url()
    
    # Determine connection arguments based on environment
    connect_args = {}
    
    if "supabase.com" in DATABASE_URL or settings.is_production:
        # Production/Supabase settings
        connect_args = {
            "sslmode": "require",
            "connect_timeout": 10,
            "application_name": "tradelab"
        }
    else:
        # Local development settings
        connect_args = {
            "sslmode": "prefer",
            "connect_timeout": 5
        }
    
    try:
        engine = create_engine(
            DATABASE_URL,
            connect_args=connect_args,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_timeout=settings.database_pool_timeout,
            pool_pre_ping=True,
            pool_recycle=3600,  # Recycle connections every hour
            echo=settings.debug and not settings.is_production,  # SQL logging in debug mode
        )
        
        # Test the connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection established successfully")
            
        return engine
        
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise


def init_database():
    """Initialize database connection and session factory."""
    global SessionLocal
    
    try:
        create_database_engine()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("Database session factory initialized")
        
        # Add connection event listeners
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Set database-specific settings on connect."""
            if hasattr(dbapi_connection, 'execute'):
                # PostgreSQL-specific settings
                cursor = dbapi_connection.cursor()
                cursor.execute("SET timezone TO 'UTC'")
                cursor.close()
        
        @event.listens_for(engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            """Log connection checkout in debug mode."""
            if settings.debug:
                logger.debug("Database connection checked out")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session with proper error handling."""
    if SessionLocal is None:
        init_database()
    
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error in session: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error in database session: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def get_db_session():
    """Context manager for database sessions."""
    if SessionLocal is None:
        init_database()
        
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Error in database session context: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def test_database_connection() -> bool:
    """Test database connectivity."""
    try:
        if engine is None:
            init_database()
            
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"Database connection test successful. PostgreSQL version: {version}")
            return True
            
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


def get_database_info() -> dict:
    """Get database connection information for debugging."""
    try:
        if engine is None:
            return {"status": "not_initialized"}
            
        with engine.connect() as conn:
            # Get basic database info
            version_result = conn.execute(text("SELECT version()"))
            version = version_result.fetchone()[0]
            
            # Get connection count
            conn_result = conn.execute(text("""
                SELECT count(*) as active_connections 
                FROM pg_stat_activity 
                WHERE state = 'active'
            """))
            active_connections = conn_result.fetchone()[0]
            
            return {
                "status": "connected",
                "database_url": str(engine.url).replace(str(engine.url.password), "***") if engine.url.password else str(engine.url),
                "version": version,
                "active_connections": active_connections,
                "pool_size": engine.pool.size(),
                "checked_out_connections": engine.pool.checkedout(),
            }
            
    except Exception as e:
        logger.error(f"Error getting database info: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


# Initialize database on module import
try:
    init_database()
except Exception as e:
    logger.warning(f"Failed to initialize database on startup: {e}")
    # Don't raise here to allow the app to start even if DB is down

