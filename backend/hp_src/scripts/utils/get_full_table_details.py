from config.database import db
import json

def get_col_details(table_name):
    query = f"""
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = '{table_name}'
    """
    return db.execute_query(query)

print("--- PRESCRIPTIONS ---")
print(json.dumps(get_col_details('prescriptions'), indent=2))
print("\n--- REPORTS ---")
print(json.dumps(get_col_details('reports'), indent=2))
