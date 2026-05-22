from config.database import db
import json

def get_full_details(table_name):
    query = f"""
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
    """
    return db.execute_query(query)

tables = ['appointments', 'patients', 'adim_patient']
for table in tables:
    print(f"\n=== {table} ===")
    details = get_full_details(table)
    for d in details:
        print(d)

# Also check for any foreign key constraints specifically
def check_fks(table_name):
    print(f"\n--- FKs for {table_name} ---")
    query = f"""
        SELECT
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.key_column_usage AS kcu 
            JOIN information_schema.constraint_column_usage AS ccu 
              ON ccu.constraint_name = kcu.constraint_name 
        WHERE kcu.table_name = '{table_name}'
    """
    res = db.execute_query(query)
    for r in res:
        print(r)

for table in tables:
    check_fks(table)
