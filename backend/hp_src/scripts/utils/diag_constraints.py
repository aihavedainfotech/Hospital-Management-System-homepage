from config.database import db
import json

def get_constraints(table_name):
    query = f"""
        SELECT
            tc.constraint_name, 
            tc.constraint_type,
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
              ON tc.constraint_name = kcu.constraint_name 
        WHERE tc.table_name = '{table_name}'
    """
    return db.execute_query(query)

print("--- adim_patient constraints ---")
print(json.dumps(get_constraints('adim_patient'), indent=2))

print("\n--- patients constraints ---")
print(json.dumps(get_constraints('patients'), indent=2))

print("\n--- appointments constraints ---")
print(json.dumps(get_constraints('appointments'), indent=2))
