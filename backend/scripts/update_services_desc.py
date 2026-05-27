import sys
import os

# Add backend directory to sys.path
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

from dotenv import load_dotenv
load_dotenv(os.path.join(_BASE, ".env"))

from hp_src.config.database import db

def update_descriptions():
    descriptions = {
        "Cardiology": "Comprehensive cardiovascular care including diagnostics, advanced heart failure management, and state-of-the-art interventional cardiology procedures.",
        "Neurology": "Advanced diagnosis and therapeutic management for brain, spine, and complex neuromuscular disorders by leading neurological experts.",
        "Orthopedics": "Expert treatments for bones, joints, ligaments, and tendons, featuring minimally invasive joint replacement surgeries and sports medicine.",
        "Pediatrics": "Compassionate, child-centered medical care ranging from routine wellness checkups and immunizations to advanced pediatric specialty treatments.",
        "Emergency": "Rapid-response 24/7 emergency and trauma care fully equipped with cutting-edge life support technologies and specialized medical personnel.",
        "Dental": "Complete oral healthcare including advanced preventive treatment, cosmetic dentistry, orthodontics, and complex oral surgery procedures.",
        "Eye Care": "Comprehensive vision care, routine eye examinations, and advanced surgical treatments for cataracts, glaucoma, and corneal diseases.",
        "Laboratory": "High-precision diagnostic testing, pathology, and molecular diagnostics delivering fast and accurate results to guide treatment.",
        "Surgery": "Advanced surgical treatments utilizing state-of-the-art minimally invasive and laparoscopic techniques for optimal patient recovery."
    }

    print("Updating service descriptions in the database...")
    for title, desc in descriptions.items():
        update_sql = "UPDATE services SET description = %s WHERE title = %s"
        res = db.execute_query(update_sql, params=(desc, title), fetch_all=False)
        print(f"Updated '{title}': {res}")

if __name__ == "__main__":
    update_descriptions()
    print("Database update completed.")
