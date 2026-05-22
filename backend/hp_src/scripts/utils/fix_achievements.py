from config.database import db

ddl = """
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    icon VARCHAR(100) DEFAULT 'fas fa-trophy',
    description TEXT,
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

data = [
    ('Appointments Hooked', '32k+', 'fas fa-calendar-check', 'Total appointments successfully booked', 'blue'),
    ('Doctors Onboarded', '450+', 'fas fa-user-md', 'Highly qualified medical professionals', 'green'),
    ('Satisfied Patients', '180k+', 'fas fa-smile', 'People who trust our healthcare services', 'orange'),
    ('Awards Won', '25+', 'fas fa-award', 'Recognition for medical excellence', 'red')
]

try:
    print("Creating achievements table...")
    db.execute_query(ddl)
    
    print("Inserting achievement data...")
    insert_query = "INSERT INTO achievements (title, value, icon, description, color) VALUES (%s, %s, %s, %s, %s)"
    for item in data:
        db.execute_query(insert_query, item)
    
    print("Success!")
except Exception as e:
    print(f"Error: {e}")
