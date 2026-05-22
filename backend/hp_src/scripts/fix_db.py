import sys
import os
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Force load the URL that works with pooling correctly via psycopg2
# or use standard port 5432 for administration without pooling issues:
os.environ['DATABASE_URL'] = 'postgresql://postgres:Sravan.9010@db.fkonwkiddbtbcexikpse.supabase.co:5432/postgres'

from hp_src.config.database import db

def run():
    print("Starting DB fix...")
    deps = {
        'DEPT001': 'Cardiology', 'DEPT002': 'Neurology', 'DEPT003': 'Orthopedic Surgeon',
        'DEPT004': 'Pediatrician', 'DEPT005': 'Emergency Medicine', 'DEPT006': 'Dermatologist',
        'DEPT007': 'Gynecologist', 'DEPT008': 'Pulmonologist', 'DEPT009': 'General Surgeon',
        'DEPT010': 'Internal Medicine'
    }
    
    for code, name in deps.items():
        db.execute_query('UPDATE doctors SET department = %s WHERE department = %s', (name, code))
        print(f"Updated {code} to {name}")

    res = db.execute_query('SELECT COUNT(*) as count FROM news_events', fetch_all=False)
    if res and int(res.get('count', 0)) == 0:
        events = [
            ('Free Health Checkup Camp', 'Join us for a free comprehensive health checkup camp this Sunday. Free blood pressure and sugar tests available.', '2026-06-15 09:00:00', 'Event'),
            ('New Advanced MRI Facility', 'We are proud to announce the inauguration of our new 3T MRI facility providing high-resolution imaging.', '2026-05-20 10:30:00', 'News'),
            ('Excellence in Healthcare Award', 'Our hospital has been recognized as the best healthcare provider in the region for 2026.', '2026-05-10 18:00:00', 'Achievement'),
            ('Blood Donation Drive', 'Be a hero. Donate blood and save lives. Refreshments will be provided for all donors.', '2026-06-05 10:00:00', 'Event')
        ]
        for e in events:
            db.execute_query('INSERT INTO news_events (title, description, event_date, type) VALUES (%s, %s, %s, %s)', e)
        print("Seeded news_events")
        
    print("Done")

if __name__ == '__main__':
    run()
