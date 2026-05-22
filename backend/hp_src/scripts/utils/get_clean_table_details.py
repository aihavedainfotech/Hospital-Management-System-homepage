from config.database import db

def get_col_details(table_name):
    query = f"""
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = '{table_name}'
    """
    res = db.execute_query(query)
    print(f"--- {table_name.upper()} ---")
    for r in res:
        print(f"{r['column_name']} | Nullable: {r['is_nullable']}")

get_col_details('prescriptions')
get_col_details('reports')
