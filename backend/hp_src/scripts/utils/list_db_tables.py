from config.database import db
import json

def get_tables():
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    return db.execute_query(query)

print(json.dumps(get_tables(), indent=2))
