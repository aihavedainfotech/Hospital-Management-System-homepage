import psycopg2
import os

def create_locks_table():
    # Use environment variables directly to avoid import issues
    host = "aws-1-ap-northeast-1.pooler.supabase.com"
    port = "6543"
    database = "postgres"
    user = "postgres.fkonwkiddbtbcexikpse"
    password = "Sravan.9010"
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='require'
        )
        cur = conn.cursor()
        
        # 1. Create the locks table
        query_locks = """
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
        cur.execute(query_locks)
        
        # 2. Also ensure appointments table has standard column types if needed
        # (Already verified it's good)
        
        conn.commit()
        print("Success: Table 'temp_slot_locks' created or already exists.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_locks_table()
