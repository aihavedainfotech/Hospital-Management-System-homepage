from dotenv import load_dotenv
load_dotenv()
from hp_src.config.database import db

def setup_services():
    print("Creating services table if not exists...")
    db.execute_query("""
    CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100)
    );
    """)

    res = db.execute_query("SELECT COUNT(*) FROM services")
    count = res[0]['count'] if res else 0

    if count == 0:
        print("Inserting services...")
        db.execute_query("""
        INSERT INTO services (title, description, icon) VALUES
        ('Cardiology', 'Expert care for heart-related conditions with advanced diagnostics and treatments.', 'fas fa-heartbeat'),
        ('Neurology', 'Comprehensive care for neurological disorders by top specialists.', 'fas fa-brain'),
        ('Pediatrics', 'Dedicated care for children, from infants to adolescents with a gentle approach.', 'fas fa-baby'),
        ('Orthopedics', 'Treatment for bone, joint, and muscle conditions and severe injuries.', 'fas fa-bone'),
        ('Oncology', 'Advanced cancer treatments with compassionate support and therapies.', 'fas fa-ribbon'),
        ('Dental Care', 'Complete dental services including regular checkups, whitening, and surgeries.', 'fas fa-tooth')
        """)
        print("Services inserted successfully!")
    else:
        print(f"Services table already has {count} rows.")

if __name__ == "__main__":
    setup_services()
