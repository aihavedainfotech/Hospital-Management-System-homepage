"""
Add refund_status column to appointments_cancelled table
Run this script once to add the missing column
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hp_src.config.database import db

def run_migration():
    """Add refund_status column to appointments_cancelled table"""
    
    print("=" * 60)
    print("MIGRATION: Add refund_status column")
    print("=" * 60)
    
    try:
        # Check if column exists
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'appointments_cancelled' 
            AND column_name = 'refund_status'
        """
        result = db.execute_query(check_query, fetch_all=False)
        
        if result:
            print("✓ Column 'refund_status' already exists in appointments_cancelled table")
            return True
        
        print("→ Adding 'refund_status' column to appointments_cancelled table...")
        
        # Add the column
        alter_query = """
            ALTER TABLE appointments_cancelled 
            ADD COLUMN refund_status VARCHAR(50) DEFAULT 'pending'
        """
        db.execute_query(alter_query)
        
        print("✓ Column added successfully")
        
        # Create index
        print("→ Creating index on refund_status...")
        index_query = """
            CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_refund_status 
            ON appointments_cancelled(refund_status)
        """
        db.execute_query(index_query)
        
        print("✓ Index created successfully")
        
        # Add comment
        comment_query = """
            COMMENT ON COLUMN appointments_cancelled.refund_status 
            IS 'Status of refund: pending (needs processing), processed (no refund needed or completed)'
        """
        db.execute_query(comment_query)
        
        print("✓ Column comment added")
        
        # Verify
        verify_query = """
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'appointments_cancelled' 
            AND column_name = 'refund_status'
        """
        result = db.execute_query(verify_query, fetch_all=False)
        
        if result:
            print("\n" + "=" * 60)
            print("MIGRATION SUCCESSFUL!")
            print("=" * 60)
            print(f"Column: {result['column_name']}")
            print(f"Type: {result['data_type']}")
            print(f"Default: {result['column_default']}")
            print("=" * 60)
            return True
        else:
            print("\n✗ Migration verification failed")
            return False
            
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
