"""
Quick script to create all database tables in production.
Run this once to initialize the database schema.
"""

import os

from database import Base, engine

# Use the production DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    print(f"Creating tables in: {DATABASE_URL[:50]}...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
else:
    print("❌ ERROR: DATABASE_URL not set")
