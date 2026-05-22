from config.database import db
res = db.execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'prescriptions'")
for r in res:
    print(r['column_name'])
