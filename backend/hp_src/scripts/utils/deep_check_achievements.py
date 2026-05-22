from config.database import db
import json

res = db.execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'achievements'")
print("--- COLUMNS ---")
print(json.dumps(res, indent=2))

res2 = db.execute_query("SELECT * FROM achievements LIMIT 1")
print("\n--- SAMPLE DATA ---")
print(json.dumps(res2, indent=2, default=str))
