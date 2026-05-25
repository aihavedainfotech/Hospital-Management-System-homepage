from typing import List, Dict, Any, Optional
from hp_src.config.database import db
import time
import os

class Appointment:
    """Appointment model class"""
    
    @staticmethod
    def get_by_doctor_date(doctor_id: str, date: str) -> List[Dict[str, Any]]:
        """Get all appointments for a doctor on a specific date"""
        query = """
        SELECT id, doctor_id, doctor_name, patient_name, patient_phone, 
               patient_age, gender, reason as description, appointment_date::text as date, 
               appointment_time as time, status, reference_number
        FROM appointments 
        WHERE doctor_id::text = %s::text AND appointment_date::text = %s::text 
        AND LOWER(status) NOT IN ('cancelled', 'rejected')
        """
        return db.execute_query(query, (doctor_id, date))
    
    @staticmethod
    def get_by_id(appointment_id: str) -> Optional[Dict[str, Any]]:
        """Get a single appointment by ID"""
        query = """
        SELECT id, doctor_id, doctor_name, patient_name, patient_phone, 
               patient_age, gender, reason as description, appointment_date::text as date, 
               appointment_time as time, status, reference_number
        FROM appointments 
        WHERE id = %s
        """
        return db.execute_query(query, (appointment_id,), fetch_all=False)
    
    @staticmethod
    def get_by_patient_name(patient_name: str) -> List[Dict[str, Any]]:
        """Get all appointments for a patient by name"""
        query = """
        SELECT id, doctor_id, doctor_name, patient_name, patient_phone, 
               patient_age, gender, reason as description, appointment_date as date, 
               appointment_time as time, status, reference_number
        FROM appointments 
        WHERE patient_name ILIKE %s AND status != 'cancelled'
        ORDER BY appointment_date DESC, appointment_time DESC
        """
        return db.execute_query(query, (f"%{patient_name}%",))
    
    @staticmethod
    def get_by_phone_date(phone: str, date: str) -> List[Dict[str, Any]]:
        """Get all active appointments for a phone number on a specific date"""
        query = """
        SELECT id, doctor_id, doctor_name, patient_name, patient_phone, 
               patient_age, gender, reason as description, appointment_date::text as date, 
               appointment_time as time, status, reference_number, department_name
        FROM appointments 
        WHERE patient_phone = %s AND appointment_date::text = %s::text AND status != 'cancelled'
        ORDER BY appointment_time ASC
        """
        return db.execute_query(query, (phone, date))
    
    @staticmethod
    def check_slot_exists(doctor_id: str, date: str, time_str: str) -> bool:
        """Check if a specific slot is already booked"""
        # Fetch all active appointments for the day
        appointments = Appointment.get_by_doctor_date(doctor_id, date)
        
        # Use normalize_time for robust comparison
        from hp_src.utils.time_utils import normalize_time
        target_time = normalize_time(time_str)
        
        for a in appointments:
            if normalize_time(a['time']) == target_time:
                return True
        return False
    
    @staticmethod
    def is_slot_bookable(doctor_id: str, date: str, time_str: str, lock_token: str = None) -> tuple:
        """
        Check if a slot is bookable (not booked AND (not locked OR locked by current token)).
        Returns (is_bookable: bool, error_message: str)
        """
        try:
            # Normalize date to YYYY-MM-DD regardless of input format
            from datetime import datetime as _dt
            clean_date = date
            if date and not date[:4].isdigit():
                try:
                    clean_date = _dt.strptime(date, '%a, %d %b %Y %H:%M:%S %Z').strftime('%Y-%m-%d')
                except Exception:
                    try:
                        clean_date = str(_dt.fromisoformat(date))[:10]
                    except Exception:
                        pass

            # 1. Check if booked
            if Appointment.check_slot_exists(doctor_id, clean_date, time_str):
                return False, "This slot is already booked."
                
            # 2. Check if locked by someone else
            import datetime
            now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            lock_query = """
            SELECT lock_token FROM temp_slot_locks 
            WHERE doctor_id::text = %s::text AND slot_date::text = %s::text 
            AND slot_time = %s AND expires_at > %s
            """
            from hp_src.utils.time_utils import normalize_time
            norm_time = normalize_time(time_str)
            existing_lock = db.execute_query(lock_query, (doctor_id, clean_date, norm_time, now), fetch_all=False)
            
            if existing_lock:
                if not lock_token or str(existing_lock['lock_token']) != str(lock_token):
                    return False, "This slot is temporarily reserved by another user."
                    
            return True, None
        except Exception as e:
            print(f"Error in is_slot_bookable: {e}")
            return False, f"Validation error: {str(e)}"
    
    @staticmethod
    def get_next_patient_id() -> str:
        """Generate the next patient_id in the P0000001 series (7 digits)"""
        try:
            # Consistently use patients table as it's the primary reference
            # Order by length then value to handle migration if digits change
            query = "SELECT id FROM patients WHERE id::text LIKE 'P%' ORDER BY LENGTH(id::text) DESC, id::text DESC LIMIT 1"
            res = db.execute_query(query)
            if res and res[0]['id']:
                current_id = res[0]['id']
                # Correctly handle PXXXXXXX format
                import re
                match = re.search(r'P(\d+)', str(current_id))
                if match:
                    numeric_part = int(match.group(1))
                    return f"P{numeric_part + 1:07d}"
                
            return "P0000001"
        except Exception as e:
            print(f"Error generating patient ID: {e}")
            import random
            return f"P{random.randint(1000000, 9999999)}"

    @staticmethod
    def ensure_patient_exists(data: Dict[str, Any]) -> tuple:
        """Find or create patient in the 'patients' table, returns (patient_id, was_new)

        Matching priority (most → least strict):
        1. phone + name + DOB          — perfect match, handles age changes
        2. phone + name + gender       — DOB not available but gender confirms
        3. phone + name                — fallback for minimal data
        If none match → new patient record created.
        Age is intentionally excluded from matching so returning patients
        aren't duplicated just because their age incremented.
        """
        from hp_src.modules.patients.model import Patient

        phone  = data.get('patient_phone') or data.get('phone')
        name   = data.get('patient_name')  or data.get('full_name') or data.get('name')
        gender = data.get('patient_gender') or data.get('gender')
        email  = data.get('patient_email') or data.get('email')
        dob    = data.get('patient_dob')
        age    = data.get('patient_age') or data.get('age')

        patient_id = None

        if name and phone:
            full_name_expr = "TRIM(BOTH FROM (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')))"
            # Split name into first/last for more accurate matching
            name_parts = name.strip().split(None, 1)
            first_name = name_parts[0]
            last_name  = name_parts[1] if len(name_parts) > 1 else ''

            # 1. phone + name + DOB (most reliable — immune to age changes)
            if dob:
                row = db.execute_query(
                    f"SELECT id FROM patients WHERE phone = %s AND {full_name_expr} ILIKE %s AND date_of_birth = %s LIMIT 1",
                    (phone, name, dob), fetch_all=False
                )
                if not row and last_name:
                    row = db.execute_query(
                        "SELECT id FROM patients WHERE phone = %s AND first_name ILIKE %s AND last_name ILIKE %s AND date_of_birth = %s LIMIT 1",
                        (phone, f"%{first_name}%", f"%{last_name}%", dob), fetch_all=False
                    )
                if row:
                    patient_id = row['id']

            # 2. phone + name + gender
            if not patient_id and gender:
                row = db.execute_query(
                    f"SELECT id FROM patients WHERE phone = %s AND {full_name_expr} ILIKE %s AND gender = %s LIMIT 1",
                    (phone, name, gender), fetch_all=False
                )
                if not row and last_name:
                    row = db.execute_query(
                        "SELECT id FROM patients WHERE phone = %s AND first_name ILIKE %s AND last_name ILIKE %s AND gender = %s LIMIT 1",
                        (phone, f"%{first_name}%", f"%{last_name}%", gender), fetch_all=False
                    )
                if row:
                    patient_id = row['id']

            # 3. phone + name only
            if not patient_id:
                row = db.execute_query(
                    f"SELECT id FROM patients WHERE phone = %s AND {full_name_expr} ILIKE %s LIMIT 1",
                    (phone, name), fetch_all=False
                )
                if not row and last_name:
                    row = db.execute_query(
                        "SELECT id FROM patients WHERE phone = %s AND first_name ILIKE %s AND last_name ILIKE %s LIMIT 1",
                        (phone, f"%{first_name}%", f"%{last_name}%"), fetch_all=False
                    )
                if row:
                    patient_id = row['id']

        if patient_id:
            # UPDATE existing patient with latest non-core details
            update_fields = []
            update_params = []

            for col, key in [
                ('email',         'patient_email'),
                ('address',       'patient_address'),
                ('date_of_birth', 'patient_dob'),
                ('pincode',       'patient_pincode'),
                ('city',          'patient_city'),
                ('state',         'patient_state'),
                ('village',       'patient_village'),
            ]:
                if data.get(key):
                    update_fields.append(f"{col} = %s")
                    update_params.append(data.get(key))

            if update_fields:
                update_query = f"UPDATE patients SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s"
                update_params.append(patient_id)
                db.execute_query(update_query, tuple(update_params))

            return patient_id, False

        # 2. If no exact match, create a new record
        patient_data = {
            'full_name':     name,
            'phone_number':  phone,
            'email':         email,
            'age':           age,
            'gender':        gender,
            'address':       data.get('patient_address'),
            'date_of_birth': data.get('patient_dob'),
            'pincode':       data.get('patient_pincode'),
            'city':          data.get('patient_city'),
            'state':         data.get('patient_state'),
            'village':       data.get('patient_village'),
        }
        
        patient_id = Patient.create_patient(patient_data)
        return patient_id, True

    @staticmethod
    def cancel(phone: str, reference: str) -> bool:
        """Cancel an appointment by phone and reference number"""
        query = """
        UPDATE appointments 
        SET status = 'cancelled' 
        WHERE patient_phone = %s AND reference_number = %s 
        RETURNING id
        """
        result = db.execute_query(query, (phone, reference), fetch_all=False)
        return bool(result)

    @staticmethod
    def cancel_and_move(appointment_id: str, reason: str) -> bool:
        """
        Cancel an appointment - UPDATE status in appointments table AND copy to appointments_cancelled:
        1. Check if appointment exists and is not already cancelled
        2. Fetch payment_id from payments table (if payment exists)
        3. Insert record into appointments_cancelled with refund_status AND payment_id:
           - If payment_status = 'paid' → refund_status = 'pending'
           - If payment_status = 'pending' or unpaid → refund_status = 'processed'
        4. UPDATE status to 'cancelled' in appointments table (KEEP the record)
        
        This ensures:
        - Cancelled appointments remain in appointments table with status='cancelled'
        - Refund tracking data is stored in appointments_cancelled table
        - Payment records are preserved and linked via payment_id
        """
        try:
            print(f"DEBUG: Cancelling appointment {appointment_id} for reason: {reason}")
            fetch_query = "SELECT * FROM appointments WHERE id = %s"
            appt = db.execute_query(fetch_query, (appointment_id,), fetch_all=False)
            if not appt:
                print(f"DEBUG: Appointment {appointment_id} not found in appointments table")
                return False

            # Check if already cancelled
            if appt.get('status', '').lower() == 'cancelled':
                print(f"DEBUG: Appointment {appointment_id} is already marked as cancelled")
                # Check if already in cancelled table
                check_query = "SELECT id FROM appointments_cancelled WHERE id = %s"
                existing = db.execute_query(check_query, (appointment_id,), fetch_all=False)
                if existing:
                    print(f"DEBUG: Already exists in appointments_cancelled table")
                    return True
            
            import time
            now_ts = time.strftime('%Y-%m-%d %H:%M:%S')

            # Determine refund_status based on payment_status
            payment_status = (appt.get('payment_status') or '').lower()
            print(f"DEBUG: Payment status = '{payment_status}'")
            if payment_status == 'paid':
                refund_status = 'pending'  # Needs refund processing
                print(f"DEBUG: Setting refund_status = 'pending' (payment was made)")
            else:
                refund_status = 'processed'  # No refund needed (not paid)
                print(f"DEBUG: Setting refund_status = 'processed' (no payment made)")

            # Fetch payment_id from payments table
            payment_id = None
            print(f"DEBUG: Looking up payment record for appointment {appointment_id}...")
            payment_query = "SELECT id FROM payments WHERE appointment_id = %s"
            payment_record = db.execute_query(payment_query, (appointment_id,), fetch_all=False)
            if payment_record:
                payment_id = payment_record['id']
                print(f"DEBUG: Found payment_id = {payment_id}")
            else:
                print(f"DEBUG: No payment record found for this appointment")

            # Check if already exists in appointments_cancelled
            check_query = "SELECT id FROM appointments_cancelled WHERE id = %s"
            existing = db.execute_query(check_query, (appointment_id,), fetch_all=False)
            
            if not existing:
                # Insert into appointments_cancelled with refund_status AND payment_id
                print(f"DEBUG: Inserting into appointments_cancelled with refund_status={refund_status}, payment_id={payment_id}")
                insert_query = """
                    INSERT INTO appointments_cancelled
                        (id, appointment_id, patient_id, doctor_id, payment_id,
                         appointment_date, appointment_time,
                         patient_name, doctor_name,
                         appoinment_status, payment_status, amount,
                         refund_amount, refund_status,
                         cancellation_reason, cancelled_at, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                amount = appt.get('payment_amount') or appt.get('amount') or 0
                db.execute_query(insert_query, (
                    appt.get('id'),
                    appt.get('id'),
                    appt.get('patient_id'),
                    appt.get('doctor_id'),
                    payment_id,  # Store the payment_id
                    appt.get('appointment_date'),
                    appt.get('appointment_time'),
                    appt.get('patient_name'),
                    appt.get('doctor_name'),
                    'cancelled',
                    appt.get('payment_status'),
                    amount,
                    amount,  # Set refund_amount to the same as amount
                    refund_status,
                    reason,
                    now_ts,
                    now_ts,
                ))
                
                print(f"DEBUG: Successfully inserted into appointments_cancelled with payment_id")
            else:
                print(f"DEBUG: Record already exists in appointments_cancelled, skipping insert")

            # UPDATE status to 'cancelled' in appointments table (KEEP the record)
            print(f"DEBUG: Updating status to 'cancelled' in appointments table...")
            update_query = "UPDATE appointments SET status = 'cancelled' WHERE id = %s"
            db.execute_query(update_query, (appointment_id,))
            
            print(f"DEBUG: Successfully updated appointment status to 'cancelled' - record KEPT in appointments table")
            return True
            
        except Exception as e:
            print(f"ERROR in cancel_and_move: {e}")
            import traceback
            traceback.print_exc()
            return False

    @staticmethod
    def update_slot(appointment_id: str, new_date: str, new_time: str) -> bool:
        """Update an existing appointment's date and time with availability check"""
        try:
            # Normalize date
            from datetime import datetime as _dt
            clean_date = new_date
            if new_date and not new_date[:4].isdigit():
                try:
                    clean_date = _dt.strptime(new_date, '%a, %d %b %Y %H:%M:%S %Z').strftime('%Y-%m-%d')
                except Exception:
                    try:
                        clean_date = str(_dt.fromisoformat(new_date))[:10]
                    except Exception:
                        pass

            find_q = "SELECT doctor_id FROM appointments WHERE id = %s"
            appt = db.execute_query(find_q, (appointment_id,), fetch_all=False)
            if not appt:
                return False
            
            doctor_id = appt['doctor_id']
            
            if Appointment.check_slot_exists(doctor_id, clean_date, new_time):
                return False

            query = """
            UPDATE appointments 
            SET appointment_date = %s, appointment_time = %s, status = 'pending'
            WHERE id = %s
            """
            db.execute_query(query, (clean_date, new_time, appointment_id))
            return True
        except Exception as e:
            print(f"Error in update_slot: {e}")
            return False

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new appointment with sequential ID (APT00001)"""
        # Generate sequential Appointment ID with retry logic to avoid duplicates
        # Check BOTH appointments and appointments_cancelled tables to ensure ID is never reused
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Get the highest ID from BOTH tables to ensure uniqueness
                apt_q = """
                    SELECT id FROM (
                        SELECT id FROM appointments WHERE id LIKE 'APT%'
                        UNION ALL
                        SELECT id FROM appointments_cancelled WHERE id LIKE 'APT%'
                    ) AS all_appointments
                    ORDER BY LENGTH(id) DESC, id DESC LIMIT 1
                """
                last_apt = db.execute_query(apt_q, fetch_all=False)
                if last_apt:
                    import re
                    match = re.search(r'APT(\d+)', str(last_apt['id']))
                    if match:
                        next_val = int(match.group(1)) + 1
                        next_id = f"APT{next_val:05d}"
                    else:
                        next_id = f"APT{int(time.time()) % 100000:05d}"
                else:
                    next_id = "APT00001"
            except:
                next_id = f"APT{int(time.time()) % 100000:05d}"

            # Ensure ID doesn't exceed varchar(10)
            if len(next_id) > 10:
                next_id = next_id[:10]
            
            # Check if this ID already exists in EITHER table (in case of race condition)
            check_query = """
                SELECT id FROM appointments WHERE id = %s
                UNION ALL
                SELECT id FROM appointments_cancelled WHERE id = %s
            """
            existing = db.execute_query(check_query, (next_id, next_id), fetch_all=False)
            if not existing:
                break  # ID is unique, proceed
            else:
                print(f"DEBUG: ID {next_id} already exists in appointments or appointments_cancelled, retrying... (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    # Last attempt, use timestamp-based ID
                    next_id = f"APT{int(time.time() * 1000) % 100000:05d}"
                else:
                    # Try incrementing by 1 more
                    import re
                    match = re.search(r'APT(\d+)', next_id)
                    if match:
                        next_val = int(match.group(1)) + 1
                        next_id = f"APT{next_val:05d}"
            
        # Ensure patient record exists and get patient_id
        patient_id, is_new = Appointment.ensure_patient_exists(data)
        data['patient_id'] = patient_id
        data['is_new_patient'] = is_new

        # DUPLICATE APPOINTMENT CHECK
        # Check: SELECT * FROM appointments WHERE patient_id=? AND department=? AND appointment_date=? AND appointment_time=?
        duplicate_query = """
        SELECT id FROM appointments 
        WHERE patient_id::text = %s::text AND department_name = %s AND appointment_date::text = %s::text AND appointment_time = %s
        """
        dup_res = db.execute_query(duplicate_query, (data['patient_id'], data['department_name'], data['date'], data['time']))
        if dup_res:
            raise Exception("Appointment already exists for this department on this date and time")

        # Ensure reference number exists
        if 'reference_number' not in data:
            data['reference_number'] = f"HVD-APP-{int(time.time() * 1000)}"
        
        query = """
        INSERT INTO appointments (
            id, token_number, patient_id, doctor_id, appointment_date, 
            appointment_time, visit_type, reason, 
            status, payment_status, payment_amount, amount, notes, created_at, 
            doctor_name, patient_name, patient_phone, patient_age, gender, reference_number,
            department_name
        )
        VALUES (%s, %s, %s::text, %s::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, reference_number, patient_id
        """
        
        # Calculate token number based on time slot index
        try:
            from hp_src.modules.doctors.model import Doctor
            from hp_src.utils.time_utils import generate_slots_from_timings, normalize_time, parse_slot_time
            
            doctor = Doctor.get_by_id(data['doctor_id'])
            if doctor:
                # Generate slots for this doctor
                consultation_duration = doctor.get('consultation_duration') or 15
                doctor_slots = generate_slots_from_timings(doctor.get('timings'), interval=int(consultation_duration))
                
                # Normalize the target time
                target_time = normalize_time(data['time'])
                
                # Find the index of the slot
                token_number = 1 # Default
                for idx, slot in enumerate(doctor_slots):
                    if normalize_time(slot['time']) == target_time:
                        token_number = idx + 1
                        break
            else:
                # Fallback to daily sequence if doctor not found
                token_query = "SELECT MAX(token_number) as max_token FROM appointments WHERE doctor_id = %s AND appointment_date = %s"
                token_res = db.execute_query(token_query, (str(data['doctor_id']), data['date']), fetch_all=False)
                token_number = int(token_res.get('max_token') or 0) + 1
        except Exception as e:
            print(f"DEBUG: Token generation failed, falling back: {e}")
            token_query = "SELECT MAX(token_number) as max_token FROM appointments WHERE doctor_id = %s AND appointment_date = %s"
            token_res = db.execute_query(token_query, (str(data['doctor_id']), data['date']), fetch_all=False)
            token_number = int(token_res.get('max_token') or 0) + 1

        params = (
            next_id,
            data.get('token_number', token_number),
            data['patient_id'],
            data['doctor_id'],
            data['date'],
            data['time'],
            data.get('visit_type', 'Consultation'),
            data.get('reason', data.get('description', '')),
            'pending',
            data.get('payment_status', 'pending'),
            data.get('payment_amount', 0),
            data.get('payment_amount', 0),  # Set amount to same value as payment_amount
            data.get('notes', ''),
            data.get('created_at', time.strftime('%Y-%m-%d %H:%M:%S')),
            data['doctor_name'],
            data['patient_name'],
            data['patient_phone'],
            data['patient_age'],
            data.get('patient_gender') or data.get('gender'),
            data['reference_number'],
            data.get('department_name')
        )
        print(f"DEBUG: Creating appointment with ID {next_id}")
        try:
            result = db.execute_query(query, params, fetch_all=False)
            print(f"DEBUG: Appointment creation result: {result}")
            # Ensure it returns the full data if possible, or at least the reference number
            if result:
                return result
            return {'id': next_id, 'reference_number': data['reference_number'], 'patient_id': data['patient_id']}
        except Exception as e:
            print(f"DEBUG: Appointment creation failed: {e}")
            raise e
