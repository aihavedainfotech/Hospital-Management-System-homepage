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
            ("Cardiology", "Comprehensive cardiovascular care including diagnostics, advanced heart failure management, and state-of-the-art interventional cardiology procedures.", "fas fa-heartbeat"),
            ("Neurology", "Advanced diagnosis and therapeutic management for brain, spine, and complex neuromuscular disorders by leading neurological experts.", "fas fa-brain"),
            ("Orthopedics", "Expert treatments for bones, joints, ligaments, and tendons, featuring minimally invasive joint replacement surgeries and sports medicine.", "fas fa-bone"),
            ("Pediatrics", "Compassionate, child-centered medical care ranging from routine wellness checkups and immunizations to advanced pediatric specialty treatments.", "fas fa-baby"),
            ("Emergency", "Rapid-response 24/7 emergency and trauma care fully equipped with cutting-edge life support technologies and specialized medical personnel.", "fas fa-ambulance"),
            ("Dental", "Complete oral healthcare including advanced preventive treatment, cosmetic dentistry, orthodontics, and complex oral surgery procedures.", "fas fa-tooth"),
            ("Eye Care", "Comprehensive vision care, routine eye examinations, and advanced surgical treatments for cataracts, glaucoma, and corneal diseases.", "fas fa-eye"),
            ("Laboratory", "High-precision diagnostic testing, pathology, and molecular diagnostics delivering fast and accurate results to guide treatment.", "fas fa-vial"),
            ("Surgery", "Advanced surgical treatments utilizing state-of-the-art minimally invasive and laparoscopic techniques for optimal patient recovery.", "fas fa-procedures")
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
