from config.database import db
import json

res = db.execute_query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
print(json.dumps(res, indent=2))
