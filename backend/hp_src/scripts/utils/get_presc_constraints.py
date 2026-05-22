from config.database import db
import json

def get_constraints(table_name):
    query = f"""
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = '{table_name}'::regclass
    """
    return db.execute_query(query)

print("--- CONSTRAINTS ---")
print(json.dumps(get_constraints('prescriptions'), indent=2))

print("\n--- MAX ID ---")
res = db.execute_query("SELECT MAX(id) FROM prescriptions")
print(res)
