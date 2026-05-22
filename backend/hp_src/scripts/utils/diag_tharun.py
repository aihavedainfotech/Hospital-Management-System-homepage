from config.database import db
import json

phone = '7993376939'
adim = db.execute_query("SELECT * FROM adim_patient WHERE phone = %s", (phone,))
patients = db.execute_query("SELECT * FROM patients WHERE phone = %s", (phone,))
appts = db.execute_query("SELECT * FROM appointments WHERE patient_phone = %s", (phone,))

print("--- ADIM_PATIENT ---")
print(json.dumps(adim, indent=2, default=str))
print("\n--- PATIENTS ---")
print(json.dumps(patients, indent=2, default=str))
print("\n--- APPOINTMENTS ---")
print(json.dumps(appts, indent=2, default=str))
