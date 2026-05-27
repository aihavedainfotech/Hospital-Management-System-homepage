from typing import List, Dict, Any, Optional
from hp_src.config.database import db

# Computed age expression — uses DOB when available, falls back to stored age
_AGE_EXPR = """
    CASE
        WHEN date_of_birth IS NOT NULL
        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::int
        ELSE age
    END AS age
"""

def _build_patient_row(row: dict) -> dict:
    """Normalise a raw patients row into a consistent shape for the frontend."""
    if not row:
        return row
    full_name = (
        (row.get('full_name') or '').strip()
        or (f"{row.get('first_name','') or ''} {row.get('last_name','') or ''}").strip()
    )
    return {
        'id':            row.get('id'),
        'full_name':     full_name,
        'phone_number':  row.get('phone_number') or row.get('phone'),
        'email':         row.get('email'),
        'date_of_birth': str(row.get('date_of_birth')) if row.get('date_of_birth') else '',
        'age':           row.get('age'),
        'gender':        row.get('gender'),
        'blood_group':   row.get('blood_group'),
        'address':       row.get('address'),
        'pincode':       row.get('pincode'),
        'city':          row.get('city'),
        'state':         row.get('state'),
        'village':       row.get('village'),
    }

class Patient:
    """Patient model class for portal functionality"""

    @staticmethod
    def get_by_phone_or_email(identifier: str) -> List[Dict[str, Any]]:
        """Search in patients table only"""
        if not identifier: return []
        # Split identifier into parts to support "bindu kumar" → first+last search
        parts = identifier.strip().split()
        first = parts[0] if parts else identifier
        last  = parts[1] if len(parts) > 1 else None

        if last:
            # "bindu kumar" — match first_name + last_name together
            q1 = f"""
            SELECT id,
                   TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) AS full_name,
                   first_name, last_name,
                   phone AS phone_number, email, date_of_birth,
                   {_AGE_EXPR},
                   gender, blood_group, address, pincode, city, state, village
            FROM patients
            WHERE (first_name ILIKE %s AND last_name ILIKE %s)
               OR TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) ILIKE %s
               OR TRIM(phone) = %s OR email = %s
            ORDER BY created_at DESC
            """
            try:
                rows = db.execute_query(q1, (f"%{first}%", f"%{last}%", f"%{identifier}%", identifier, identifier), fetch_all=True)
                return [_build_patient_row(r) for r in (rows or [])]
            except Exception as e:
                print(f"get_by_phone_or_email error: {e}")
                return []
        else:
            q1 = f"""
            SELECT id,
                   TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) AS full_name,
                   first_name, last_name,
                   phone AS phone_number, email, date_of_birth,
                   {_AGE_EXPR},
                   gender, blood_group, address, pincode, city, state, village
            FROM patients
            WHERE TRIM(phone) = %s OR email = %s
               OR first_name ILIKE %s OR last_name ILIKE %s
               OR phone ILIKE %s
            ORDER BY created_at DESC
            """
            try:
                rows = db.execute_query(q1, (identifier, identifier, f"%{identifier}%", f"%{identifier}%", f"%{identifier}%"), fetch_all=True)
                return [_build_patient_row(r) for r in (rows or [])]
            except Exception as e:
                print(f"get_by_phone_or_email error: {e}")
                return []

    @staticmethod
    def create_patient(data: Dict[str, Any]) -> str:
        """Create a new patient record and return the ID"""
        from hp_src.modules.appointments.model import Appointment
        patient_id = Appointment.get_next_patient_id()

        full_name = data.get('full_name', '')
        parts = full_name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

        query = """
        INSERT INTO patients (id, first_name, last_name, phone, email, date_of_birth, age,
                              gender, address, pincode, city, state, village,
                              admitted_on, patient_type, severity)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        import time
        params = (
            patient_id, first_name, last_name,
            data.get('phone_number') or data.get('phone'),
            data.get('email'),
            data.get('date_of_birth') or None,
            data.get('age'),
            data.get('gender'),
            data.get('address'),
            data.get('pincode'),
            data.get('city'),
            data.get('state'),
            data.get('village'),
            time.strftime('%Y-%m-%d %H:%M:%S'),
            'Outpatient', 'Normal',
        )
        db.execute_query(query, params)
        return patient_id

    @staticmethod
    def get_all_by_phone(phone: str) -> List[Dict[str, Any]]:
        """Efficiently get all patients matching a phone (robust to leading 0s)"""
        if not phone: return []
        clean_phone = phone.lstrip('0')
        phone_with_zero = '0' + clean_phone if not phone.startswith('0') else phone
        query = f"""
        SELECT id,
               TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) AS full_name,
               first_name, last_name,
               phone AS phone_number, email, date_of_birth,
               {_AGE_EXPR},
               gender, blood_group, address, pincode, city, state, village
        FROM patients
        WHERE phone = %s OR phone = %s OR phone LIKE %s
        ORDER BY created_at DESC
        """
        try:
            rows = db.execute_query(query, (clean_phone, phone_with_zero, f"%{clean_phone}%"), fetch_all=True)
            return [_build_patient_row(r) for r in (rows or [])]
        except Exception as e:
            print(f"Error in get_all_by_phone: {e}")
            return []

    @staticmethod
    def get_by_phone(phone: str) -> Optional[Dict[str, Any]]:
        """Get patient details by phone"""
        pt_query = f"""
        SELECT id,
               TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) AS full_name,
               first_name, last_name,
               phone AS phone_number, email, date_of_birth,
               {_AGE_EXPR},
               gender, blood_group, address, pincode, city, state, village
        FROM patients WHERE phone = %s LIMIT 1
        """
        pt_data = db.execute_query(pt_query, (phone,), fetch_all=False)
        if pt_data:
            return _build_patient_row(pt_data)

        # Fallback to appointments
        apt_query = "SELECT patient_id, patient_name, patient_age FROM appointments WHERE patient_phone = %s LIMIT 1"
        apt_data = db.execute_query(apt_query, (phone,), fetch_all=False)
        if apt_data:
            return {
                'phone_number': phone, 'full_name': apt_data['patient_name'],
                'age': apt_data['patient_age'], 'id': apt_data['patient_id'],
            }
        return None

    @staticmethod
    def get_by_id(patient_id: str) -> Optional[Dict[str, Any]]:
        """Get patient details by Patient ID"""
        pt_query = f"""
        SELECT id,
               TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) AS full_name,
               first_name, last_name,
               phone AS phone_number, email, date_of_birth,
               {_AGE_EXPR},
               gender, blood_group, address, pincode, city, state, village
        FROM patients WHERE id = %s LIMIT 1
        """
        pt_data = db.execute_query(pt_query, (patient_id,), fetch_all=False)
        if pt_data:
            row = _build_patient_row(pt_data)
            # keep legacy keys for callers that use 'phone' / 'name' / 'patient_id'
            row['phone'] = row['phone_number']
            row['name'] = row['full_name']
            row['patient_id'] = row['id']
            return row

        # Fallback to appointments
        apt_query = "SELECT patient_phone, patient_age, patient_name FROM appointments WHERE patient_id = %s LIMIT 1"
        apt_data = db.execute_query(apt_query, (patient_id,), fetch_all=False)
        if apt_data:
            return {
                'phone': apt_data['patient_phone'], 'phone_number': apt_data['patient_phone'],
                'name': apt_data['patient_name'], 'full_name': apt_data['patient_name'],
                'age': apt_data['patient_age'], 'patient_id': patient_id, 'id': patient_id,
            }
        return None

    @staticmethod
    def get_prescriptions(patient_id: str) -> List[Dict[str, Any]]:
        """Get all fields from the prescriptions table for a patient"""
        if not patient_id: return []
        query = """
        SELECT p.id, d.name as doctor_name, p.created_at::text as date, p.medication as medications, p.dosage, p.instructions,
               p.status, p.created_at::text as updated_at
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        WHERE p.patient_id = %s
        ORDER BY p.created_at DESC
        """
        return db.execute_query(query, (patient_id,))

    @staticmethod
    def get_reports_by_id(patient_id: str) -> List[Dict[str, Any]]:
        """Get reports for a patient from generated_reports table"""
        if not patient_id: return []
        
        query = """
        SELECT id, report_code as title, generated_at::text as date, 'Lab Report' as type, 
               doctor_id as doctor_name, lab_order_id, created_at::text
        FROM generated_reports 
        WHERE patient_id = %s
        ORDER BY generated_at DESC
        """
        res = db.execute_query(query, (patient_id,))
        if res: return res
        
        # Fallback: search by name/phone if patient_id link is weak
        patient = Patient.get_by_id(patient_id)
        if patient and patient['phone']:
            # Search by patient_id in generating_reports is preferred, 
            # but if we find none, we might try to map via names in another table if needed.
            # For now, stick to patient_id as it's the standard in ADIM.
            pass
            
        return []

    @staticmethod
    def get_report_pdf(report_id: str) -> Optional[bytes]:
        """Fetch the binary PDF content for a report"""
        query = "SELECT pdf_file FROM generated_reports WHERE id = %s"
        res = db.execute_query(query, (report_id,), fetch_all=False)
        return res['pdf_file'] if res and res['pdf_file'] else None

    @staticmethod
    def get_appointments(patient_id: str) -> List[Dict[str, Any]]:
        """Get all appointments (active and cancelled) for a patient"""
        if not patient_id: return []
        
        # UNION query to get both active and cancelled appointments
        query = """
        SELECT 
            id, 
            doctor_id, 
            doctor_name, 
            appointment_date::text as date, 
            appointment_time::text as time, 
            status, 
            reference_number, 
            department_name as department, 
            payment_status, 
            payment_amount::float as payment_amount,
            NULL as refund_status,
            NULL as cancellation_reason,
            NULL as cancelled_at
        FROM appointments 
        WHERE patient_id = %s
        
        UNION ALL
        
        SELECT 
            id, 
            doctor_id, 
            doctor_name, 
            appointment_date::text as date, 
            appointment_time::text as time, 
            appoinment_status as status,
            id as reference_number,
            NULL as department,
            payment_status, 
            amount::float as payment_amount,
            refund_status,
            cancellation_reason,
            cancelled_at::text
        FROM appointments_cancelled 
        WHERE patient_id = %s
        
        ORDER BY date DESC, time DESC
        """
        return db.execute_query(query, (patient_id, patient_id))

    @staticmethod
    def get_lab_orders_by_id(patient_id: str) -> List[Dict[str, Any]]:
        """Get lab orders for a patient from lab_prescriptions_outpatients"""
        if not patient_id: return []
        
        query = """
        SELECT order_id as id, test_name, doctor_name, 'Laboratory' as department, 
               labtests_status as status, created_time::text as order_date, 
               payment_status, amount::float as amount, prescription_id
        FROM lab_prescriptions_outpatients 
        WHERE patient_id = %s
        ORDER BY created_time DESC
        """
        try:
            return db.execute_query(query, (patient_id,))
        except Exception as e:
            print(f"Error querying lab orders: {e}")
            return []

