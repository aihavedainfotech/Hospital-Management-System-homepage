import sys
import os

# Add backend directory to sys.path
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

from dotenv import load_dotenv
load_dotenv(os.path.join(_BASE, ".env"))

from hp_src.config.database import db

def run_migration():
    print("Creating services table if not exists...")
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255)
    );
    """
    db.execute_query(create_table_sql, fetch_all=False)
    
    print("Checking if services exist...")
    existing = db.execute_query("SELECT COUNT(*) as count FROM services")
    count = existing[0]['count'] if existing else 0
    
    if count == 0:
        print("Inserting initial services data...")
        services_data = [
            ("Cardiology", "Expert heart care", "fas fa-heartbeat"),
            ("Neurology", "Advanced brain care", "fas fa-brain"),
            ("Orthopedics", "Bone & joint specialists", "fas fa-bone"),
            ("Pediatrics", "Care for children", "fas fa-baby"),
            ("Emergency", "24/7 emergency services", "fas fa-ambulance"),
            ("Dental", "Complete dental care", "fas fa-tooth"),
            ("Eye Care", "Vision & eye specialists", "fas fa-eye"),
            ("Laboratory", "Diagnostic testing", "fas fa-vial"),
            ("Surgery", "Advanced surgical care", "fas fa-procedures")
        ]
        
        insert_sql = "INSERT INTO services (title, description, icon) VALUES (%s, %s, %s)"
        for s in services_data:
            db.execute_query(insert_sql, params=s, fetch_all=False)
        print(f"Inserted {len(services_data)} services.")
    else:
        print(f"Table already contains {count} services. Skipping insertion.")

if __name__ == "__main__":
    run_migration()
    print("Migration completed successfully.")
