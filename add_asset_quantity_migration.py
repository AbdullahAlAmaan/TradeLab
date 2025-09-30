#!/usr/bin/env python3
"""
Migration script to add quantity and purchase_price columns to assets table.
Run this script to update the database schema.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def run_migration():
    """Add quantity and purchase_price columns to assets table."""
    try:
        # Get database URL from environment variable
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            print("Please set DATABASE_URL environment variable or run:")
            print("export DATABASE_URL='your_database_url_here'")
            sys.exit(1)
        
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
                
                # Commit the transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                print("Added quantity and purchase_price columns to assets table.")
                
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
