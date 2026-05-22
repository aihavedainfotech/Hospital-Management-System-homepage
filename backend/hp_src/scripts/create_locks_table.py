from config.database import db

def create_locks_table():
    query = """
    CREATE TABLE IF NOT EXISTS temp_slot_locks (
        id SERIAL PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        slot_date DATE NOT NULL,
        slot_time TEXT NOT NULL,
        lock_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE (doctor_id, slot_date, slot_time)
    )
    """
    try:
        db.execute_query(query)
        print("Table 'temp_slot_locks' created successfully")
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_locks_table()
