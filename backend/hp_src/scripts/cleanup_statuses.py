import sys
import os
sys.path.append(os.getcwd())
try:
    from config.database import db
    # Get all distinct statuses
    res = db.execute_query("SELECT DISTINCT status FROM appointments")
    statuses = [r['status'] for r in res if r['status']]
    
    print(f"Found statuses: {statuses}")
    
    # Update all to lowercase
    for s in statuses:
        if s != s.lower():
            print(f"Normalizing '{s}' to '{s.lower()}'...")
            db.execute_query("UPDATE appointments SET status = %s WHERE status = %s", (s.lower(), s))
    
    # Also handle appointments_cancelled table if exists
    try:
        db.execute_query("UPDATE appointments_cancelled SET status = 'cancelled' WHERE status != 'cancelled'")
        print("Normalized appointments_cancelled table.")
    except:
        pass
        
    print("Data normalization complete.")
except Exception as e:
    print(f"Error: {e}")
