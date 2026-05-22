import os
import sys

# Hardcode the Supabase URL to set up the remote database for Render
supabase_url = "postgresql://postgres.fkonwkiddbtbcexikpse:Sravan.9010@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

def create_homepage_tables():
    import psycopg2
    try:
        conn = psycopg2.connect(supabase_url)
        cur = conn.cursor()
        
        print("Creating Homepage Tables on Supabase...")
        
        tables_ddl = [
            # 1. Doctors
            """
            CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                experience_years INT,
                photo TEXT,
                available_days TEXT,
                timings TEXT,
                rating FLOAT DEFAULT 0.0,
                qualification TEXT,
                consultation_fee INT DEFAULT 500,
                is_active BOOLEAN DEFAULT TRUE,
                unavailable_dates TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 2. News and Events
            """
            CREATE TABLE IF NOT EXISTS news_events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                event_date TIMESTAMP NOT NULL,
                type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 3. Achievements
            """
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                value VARCHAR(255) NOT NULL,
                icon VARCHAR(100) DEFAULT 'fas fa-trophy',
                description TEXT,
                color VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 4. Complaints
            """
            CREATE TABLE IF NOT EXISTS complaints (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                patient_contact VARCHAR(20),
                patient_email VARCHAR(255),
                department VARCHAR(100),
                category VARCHAR(100),
                priority VARCHAR(50),
                message TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP
            );
            """,
            
            # 5. Suggestions
            """
            CREATE TABLE IF NOT EXISTS suggestions (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                phone VARCHAR(20),
                email VARCHAR(255),
                department VARCHAR(100),
                visit_date DATE,
                subject VARCHAR(255),
                message TEXT,
                anonymous BOOLEAN DEFAULT FALSE,
                reference_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 6. Compliments
            """
            CREATE TABLE IF NOT EXISTS compliments (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                phone VARCHAR(20),
                email VARCHAR(255),
                department VARCHAR(100),
                visit_date DATE,
                subject VARCHAR(255),
                message TEXT,
                anonymous BOOLEAN DEFAULT FALSE,
                reference_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 7. Patients
            """
            CREATE TABLE IF NOT EXISTS patients (
                id VARCHAR(50) PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(255),
                date_of_birth DATE,
                age INT,
                gender VARCHAR(20),
                blood_group VARCHAR(10),
                address TEXT,
                pincode VARCHAR(20),
                city VARCHAR(100),
                state VARCHAR(100),
                village VARCHAR(100),
                admitted_on TIMESTAMP,
                patient_type VARCHAR(50),
                severity VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 8. Appointments
            """
            CREATE TABLE IF NOT EXISTS appointments (
                id VARCHAR(50) PRIMARY KEY,
                token_number INT,
                patient_id VARCHAR(50),
                doctor_id VARCHAR(50),
                appointment_date DATE,
                appointment_time TIME,
                visit_type VARCHAR(50),
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_amount DECIMAL(10,2),
                amount DECIMAL(10,2),
                notes TEXT,
                doctor_name VARCHAR(255),
                patient_name VARCHAR(255),
                patient_phone VARCHAR(20),
                patient_age INT,
                gender VARCHAR(20),
                reference_number VARCHAR(100),
                department_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 9. Appointments Cancelled
            """
            CREATE TABLE IF NOT EXISTS appointments_cancelled (
                id VARCHAR(50) PRIMARY KEY,
                appointment_id VARCHAR(50),
                patient_id VARCHAR(50),
                doctor_id VARCHAR(50),
                payment_id VARCHAR(50),
                appointment_date DATE,
                appointment_time TIME,
                patient_name VARCHAR(255),
                doctor_name VARCHAR(255),
                appoinment_status VARCHAR(50),
                payment_status VARCHAR(50),
                amount DECIMAL(10,2),
                refund_amount DECIMAL(10,2),
                refund_status VARCHAR(50) DEFAULT 'pending',
                cancellation_reason TEXT,
                cancelled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # 10. Slot Locks
            """
            CREATE TABLE IF NOT EXISTS temp_slot_locks (
                id SERIAL PRIMARY KEY,
                doctor_id TEXT NOT NULL,
                slot_date DATE NOT NULL,
                slot_time TEXT NOT NULL,
                lock_token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                UNIQUE (doctor_id, slot_date, slot_time)
            );
            """
        ]

        for ddl in tables_ddl:
            cur.execute(ddl)
            print("Successfully created a table.")

        print("\nAll required tables have been created successfully!")
        
        # Check if achievements need default data
        print("Checking achievements data...")
        cur.execute("SELECT COUNT(*) FROM achievements")
        achievements_count = cur.fetchone()[0]
        if achievements_count == 0:
            print("Inserting default achievements...")
            data = [
                ('Appointments Hooked', '32k+', 'fas fa-calendar-check', 'Total appointments successfully booked', 'blue'),
                ('Doctors Onboarded', '450+', 'fas fa-user-md', 'Highly qualified medical professionals', 'green'),
                ('Satisfied Patients', '180k+', 'fas fa-smile', 'People who trust our healthcare services', 'orange'),
                ('Awards Won', '25+', 'fas fa-award', 'Recognition for medical excellence', 'red')
            ]
            insert_query = "INSERT INTO achievements (title, value, icon, description, color) VALUES (%s, %s, %s, %s, %s)"
            for item in data:
                cur.execute(insert_query, item)
            print("Default achievements inserted.")

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_homepage_tables()
