#!/usr/bin/env python3
"""
Migration script to add quantity and purchase_price columns to assets table.
This script uses the existing backend configuration.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the current directory to the path
sys.path.append(os.path.dirname(__file__))

from app.config import settings
from app.database import construct_database_url

def run_migration():
    """Add quantity and purchase_price columns to assets table."""
    try:
        # Use the existing database URL construction
        database_url = construct_database_url()
        print(f"Using database URL: {database_url[:50]}...")
        
        # Create database engine
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                # Add quantity column
                print("Adding quantity column to assets table...")
                conn.execute(text("""
                    ALTER TABLE assets 
                    ADD COLUMN IF NOT EXISTS quantity NUMERIC(20,8) NOT NULL DEFAULT 1
                """))
                
                # Add purchase_price column
                print("Adding purchase_price column to assets table...")
                conn.execute(text("""
                    ALTER TABLE assets 
                    ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(20,8) NOT NULL DEFAULT 0
                """))
                
                # Update existing assets to have default values
                print("Updating existing assets with default values...")
                conn.execute(text("""
                    UPDATE assets 
                    SET quantity = 1 
                    WHERE quantity IS NULL
                """))
                
                conn.execute(text("""
                    UPDATE assets 
                    SET purchase_price = 0 
                    WHERE purchase_price IS NULL
                """))
                
                # Commit the transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                print("Added quantity and purchase_price columns to assets table.")
                print("Updated existing assets with default values.")
                
            except SQLAlchemyError as e:
                # Rollback on error
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                raise
                
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Running database migration...")
    run_migration()
