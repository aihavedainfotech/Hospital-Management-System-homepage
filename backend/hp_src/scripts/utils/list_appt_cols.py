from config.database import db
import json

res = db.execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'")
for r in res:
    print(r['column_name'])
