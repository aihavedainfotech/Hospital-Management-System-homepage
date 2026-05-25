import os
import psycopg2
from datetime import datetime, timedelta

# Hardcode the URL as it is configured
supabase_url = "postgresql://postgres:Tharun%4079933@db.sgghsxjodhailolrbyar.supabase.co:5432/postgres"

def insert_dummy_data():
    try:
        conn = psycopg2.connect(supabase_url)
        cur = conn.cursor()
        
        print("Inserting dummy data...")

        # 1. Doctors
        doctors_data = [
            ('Dr. Sarah Jenkins', 'Cardiologist', 'Cardiology', 12, 'Mon, Wed, Fri', '09:00 AM - 02:00 PM', 4.8, 'MBBS, MD', 800, True, 'Providing expert heart care.'),
            ('Dr. Robert Chen', 'Neurologist', 'Neurology', 15, 'Tue, Thu, Sat', '10:00 AM - 04:00 PM', 4.9, 'MBBS, DM', 1000, True, 'Specialized in treating nervous system disorders.'),
            ('Dr. Emily White', 'Pediatrician', 'Pediatrics', 8, 'Everyday', '08:00 AM - 01:00 PM', 4.7, 'MBBS, MD (Pediatrics)', 600, True, 'Friendly and experienced child specialist.'),
            ('Dr. Michael Brown', 'Orthopedic Surgeon', 'Orthopedics', 20, 'Mon, Tue, Wed, Thu', '02:00 PM - 07:00 PM', 4.6, 'MS Orthopedics', 1200, True, 'Expert in joint replacements and fractures.')
        ]
        cur.executemany("""
            INSERT INTO doctors (name, specialization, department, experience_years, available_days, timings, rating, qualification, consultation_fee, is_active, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, doctors_data)

        # 2. News and Events
        now = datetime.now()
        news_data = [
            ('Free Health Camp', 'Join our free health checkup camp this weekend.', now + timedelta(days=5), 'Event'),
            ('New MRI Machine Installed', 'We have upgraded our imaging department with a state-of-the-art MRI machine.', now - timedelta(days=2), 'News'),
            ('Hospital Excellence Award', 'Haveda Hospital was awarded the best regional hospital of the year.', now - timedelta(days=10), 'Achievement')
        ]
        cur.executemany("""
            INSERT INTO news_events (title, description, event_date, type)
            VALUES (%s, %s, %s, %s)
        """, news_data)

        # 4. Complaints
        complaints_data = [
            ('John Doe', '1234567890', 'john@example.com', 'Cardiology', 'Staff Behavior', 'Medium', 'Wait time was a bit too long.'),
            ('Jane Smith', '0987654321', 'jane@example.com', 'General', 'Cleanliness', 'High', 'The waiting area could be cleaner.')
        ]
        cur.executemany("""
            INSERT INTO complaints (name, patient_contact, patient_email, department, category, priority, message)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, complaints_data)

        # 7. Patients
        patients_data = [
            ('PAT001', 'Alice', 'Johnson', '1112223333', 'alice@example.com', '1990-05-15', 36, 'Female', 'O+', '123 Main St', '10001', 'New York', 'NY', 'Manhattan', 'Outpatient', 'Low'),
            ('PAT002', 'Bob', 'Williams', '4445556666', 'bob@example.com', '1985-08-22', 40, 'Male', 'A+', '456 Oak St', '10002', 'New York', 'NY', 'Brooklyn', 'Inpatient', 'Medium')
        ]
        cur.executemany("""
            INSERT INTO patients (id, first_name, last_name, phone, email, date_of_birth, age, gender, blood_group, address, pincode, city, state, village, patient_type, severity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, patients_data)

        # 8. Appointments
        appointments_data = [
            ('APP001', 1, 'PAT001', '1', now.strftime('%Y-%m-%d'), '10:00:00', 'Consultation', 'Routine checkup', 'confirmed', 'paid', 800.0, 800.0, 'None', 'Dr. Sarah Jenkins', 'Alice Johnson', '1112223333', 36, 'Female', 'Cardiology'),
            ('APP002', 2, 'PAT002', '2', (now + timedelta(days=1)).strftime('%Y-%m-%d'), '14:30:00', 'Follow-up', 'Headache issues', 'pending', 'pending', 0.0, 1000.0, 'None', 'Dr. Robert Chen', 'Bob Williams', '4445556666', 40, 'Male', 'Neurology')
        ]
        cur.executemany("""
            INSERT INTO appointments (id, token_number, patient_id, doctor_id, appointment_date, appointment_time, visit_type, reason, status, payment_status, payment_amount, amount, notes, doctor_name, patient_name, patient_phone, patient_age, gender, department_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, appointments_data)

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully inserted dummy data into all major tables!")
    except Exception as e:
        print(f"Error inserting dummy data: {e}")

if __name__ == "__main__":
    insert_dummy_data()
