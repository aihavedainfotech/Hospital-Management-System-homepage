from config.database import db
import time
from typing import Dict, Any

def get_next_patient_id() -> str:
    try:
        query = "SELECT id FROM patients WHERE id::text LIKE 'P%' ORDER BY id DESC LIMIT 1"
        res = db.execute_query(query)
        if res and res[0]['id']:
            current_id = res[0]['id']
            numeric_part = int(current_id.replace('P', ''))
            return f"P{numeric_part + 1:05d}"
        return "P00001"
    except Exception as e:
        print(f"Error generating patient ID: {e}")
        return "P99999"

def ensure_patient_exists(data: Dict[str, Any]) -> str:
    patient_id = get_next_patient_id()
    print(f"Generated patient_id: {patient_id}")
    
    check_pt = db.execute_query("SELECT id FROM patients WHERE id = %s", (patient_id,))
    if not check_pt:
        print("Creating minimal patient record...")
        insert_pt = """
        INSERT INTO patients (id, patient_type, severity, admitted_on, first_name)
        VALUES (%s, %s, %s, %s, %s)
        """
        first_name = data['patient_name'].split()[0] if data['patient_name'] else 'Patient'
        db.execute_query(insert_pt, (patient_id, 'Outpatient', 'Normal', time.strftime('%Y-%m-%d %H:%M:%S'), first_name))
        
        print("Creating adim_patient record...")
        insert_adim = """
        INSERT INTO adim_patient (phone, name, age)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
        """
        db.execute_query(insert_adim, (data['patient_phone'], data['patient_name'], data['patient_age']))
        
    return patient_id

def create_appointment(data: Dict[str, Any]):
    next_id = f"A{int(time.time() * 100) % 1000000000:09d}"
    data['patient_id'] = ensure_patient_exists(data)
    
    query = """
    INSERT INTO appointments (
        id, token_number, patient_id, doctor_id, appointment_date, 
        appointment_time, visit_type, reason, 
        status, payment_status, payment_amount, notes, created_at, 
        doctor_name, patient_name, patient_phone, patient_age, reference_number,
        department_name
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    params = (
        next_id, 1, data['patient_id'], data['doctor_id'], data['date'],
        data['time'], 'Consultation', '',
        'booked', 'pending', 0, '', time.strftime('%Y-%m-%d %H:%M:%S'),
        'Dr. Anitha Nair', data['patient_name'], data['patient_phone'], data['patient_age'],
        f"HVD-APP-{int(time.time() * 1000)}", 'Pediatrics'
    )
    db.execute_query(query, params)
    print("Appointment created successfully")

data = {
    'doctor_id': 'D00004',
    'patient_name': 'Tharun',
    'patient_phone': '7993376939',
    'patient_age': 19,
    'date': '2026-04-25',
    'time': '12:00 PM'
}

try:
    create_appointment(data)
except Exception as e:
    print(f"FAILED: {e}")
