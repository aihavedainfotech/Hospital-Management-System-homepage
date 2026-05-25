from flask import Blueprint, request, jsonify
import datetime
import re
from hp_src.modules.doctors.model import Doctor
from hp_src.config.database import db
from hp_src.utils.time_utils import normalize_time, generate_slots_from_timings, parse_slot_time

doctors_bp = Blueprint('doctors', __name__)

def _normalize_doctor(d):
    """Alias experience_years → experience so the frontend Doctor interface works."""
    if d and 'experience_years' in d and 'experience' not in d:
        d['experience'] = d['experience_years']
    return d

@doctors_bp.route('', methods=['GET'])
def get_all_doctors():
    """Get all doctors"""
    try:
        doctors = Doctor.get_all()
        doctors = [_normalize_doctor(dict(d)) for d in (doctors or [])]
        return jsonify({
            'success': True,
            'data': doctors,
            'count': len(doctors)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@doctors_bp.route('/<string:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """Get doctor by ID"""
    try:
        doctor = Doctor.get_by_id(doctor_id)
        if doctor:
            return jsonify({
                'success': True,
                'data': _normalize_doctor(dict(doctor))
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Doctor not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@doctors_bp.route('/department/<string:department>', methods=['GET'])
def get_doctors_by_department(department):
    """Get doctors by department"""
    try:
        doctors = Doctor.get_by_department(department)
        return jsonify({
            'success': True,
            'data': doctors,
            'count': len(doctors)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@doctors_bp.route('', methods=['POST'])
def create_doctor():
    """Create new doctor"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'specialization', 'department', 'experience']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        doctor = Doctor.create(data)
        return jsonify({
            'success': True,
            'data': doctor,
            'message': 'Doctor created successfully'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@doctors_bp.route('/<string:doctor_id>', methods=['PUT'])
def update_doctor(doctor_id):
    """Update doctor information"""
    try:
        data = request.get_json()
        doctor = Doctor.update(doctor_id, data)
        
        if doctor:
            return jsonify({
                'success': True,
                'data': doctor,
                'message': 'Doctor updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Doctor not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@doctors_bp.route('/<string:doctor_id>', methods=['DELETE'])
def delete_doctor(doctor_id):
    """Delete doctor"""
    try:
        success = Doctor.delete(doctor_id)
        if success:
            return jsonify({
                'success': True,
                'message': 'Doctor deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Doctor not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

from hp_src.modules.appointments.model import Appointment
import datetime

# Removed local definitions of generate_slots_from_timings and parse_slot_time
# They are now imported from hp_src.utils.time_utils

def is_day_available(available_days, date_str):
    """Check if doctor is available on a specific date"""
    if not available_days or not date_str:
        return True
    
    lower_range = str(available_days).lower()
    if lower_range in ['24/7', 'always', 'everyday']:
        return True
        
    try:
        dt = datetime.datetime.fromisoformat(date_str)
        day_name = dt.strftime('%a').lower() # mon, tue, etc.
        days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        
        if '-' in lower_range:
            parts = [p.strip()[:3] for p in lower_range.split('-')]
            if len(parts) == 2:
                try:
                    start_idx = days.index(parts[0])
                    end_idx = days.index(parts[1])
                    curr_idx = (dt.weekday() + 1) % 7 # 0=Sun, 1=Mon...
                    if start_idx <= end_idx:
                        return start_idx <= curr_idx <= end_idx
                    else: # wrap around
                        return curr_idx >= start_idx or curr_idx <= end_idx
                except ValueError:
                    # Fallback to simple containment if day names are weird
                    return day_name in lower_range
        
        day_list = [d.strip()[:3] for d in lower_range.split(',')]
        return day_name in day_list
    except:
        return True

@doctors_bp.route('/<string:doctor_id>/slots', methods=['GET'])
def get_doctor_slots(doctor_id):
    """Get available slots for a doctor with strict day and time checks"""
    try:
        date_str = request.args.get('date')
        if not date_str:
            return jsonify({'success': False, 'error': 'Date is required'}), 400
            
        doctor = Doctor.get_by_id(doctor_id)
        if not doctor:
            return jsonify({'success': False, 'error': 'Doctor not found'}), 404
            
        # Check if doctor is available on this day
        if not is_day_available(doctor.get('available_days'), date_str):
            return jsonify({
                'success': True,
                'data': [],
                'doctor_id': doctor_id,
                'date': date_str,
                'message': 'Doctor not available on this day'
            })

        # Check if date is in doctor's unavailable_dates (leave/off)
        unavailable_dates = doctor.get('unavailable_dates') or []
        if isinstance(unavailable_dates, str):
            import json
            try: unavailable_dates = json.loads(unavailable_dates)
            except: unavailable_dates = []
        if date_str in unavailable_dates:
            return jsonify({
                'success': True,
                'data': [],
                'doctor_id': doctor_id,
                'date': date_str,
                'on_leave': True,
                'message': 'Doctor is on leave on this date'
            })
            
        # Generate all possible slots using the doctor's consultation duration
        consultation_duration = doctor.get('consultation_duration') or 15
        slots = generate_slots_from_timings(doctor.get('timings'), interval=int(consultation_duration))
        
        # 1. Get booked slots
        booked_appointments = Appointment.get_by_doctor_date(doctor_id, date_str)
        
        # 2. Get active locks (not expired)
        import time
        current_ts = time.strftime('%Y-%m-%d %H:%M:%S')
        lock_query = """
        SELECT slot_time, lock_token 
        FROM temp_slot_locks 
        WHERE doctor_id = %s AND slot_date = %s AND expires_at > %s
        """
        active_locks = db.execute_query(lock_query, (str(doctor_id), date_str, current_ts))
        # Map booked times using normalize_time
        # Use lowercase check for status to be robust
        booked_map = {}
        for a in booked_appointments:
            status = a.get('status', '').lower()
            if status not in ('cancelled', 'rejected'):
                booked_map[normalize_time(a['time'])] = a
        lock_map = {l['slot_time']: l['lock_token'] for l in active_locks}
        
        # Check if date is today to filter past slots
        # datetime.now() uses TZ env var set to Asia/Kolkata in docker-compose
        now = datetime.datetime.now()
        is_today = date_str == now.strftime('%Y-%m-%d')
        current_minutes = now.hour * 60 + now.minute
        
        # Use the requested lock token if provided
        token = request.args.get('lock_token')

        final_slots = []
        for slot in slots:
            # Create a copy to avoid mutating the original generated slots
            slot_copy = slot.copy()
            normalized_slot_time = normalize_time(slot_copy['time'])
            slot_copy['status'] = 'available'
            slot_copy['is_mine'] = False
            
            # 1. Check if booked
            if normalized_slot_time in booked_map:
                slot_copy['status'] = 'booked'
                slot_copy['available'] = False
            
            # 2. Check if locked
            elif normalized_slot_time in lock_map:
                slot_copy['status'] = 'locked'
                slot_copy['available'] = False
                if lock_map[normalized_slot_time] == token:
                    slot_copy['is_mine'] = True
                    slot_copy['available'] = True # Available to the person who locked it
            
            # 3. Check if past (if today)
            if is_today and slot_copy['available']:
                slot_minutes = parse_slot_time(slot_copy['time'])
                if slot_minutes <= current_minutes + 15: # 15 min buffer
                    slot_copy['status'] = 'past'
                    slot_copy['available'] = False
            
            final_slots.append(slot_copy)
        
        print(f"DEBUG: Returning {len(final_slots)} slots for doctor {doctor_id} on {date_str}")
        return jsonify({
            'success': True,
            'data': final_slots,
            'doctor_id': doctor_id,
            'date': date_str
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@doctors_bp.route('/slots/lock', methods=['POST'])
def lock_slot():
    """Temporarily lock a slot for 7 minutes"""
    try:
        data = request.get_json()
        doctor_id = data.get('doctor_id')
        date = data.get('date')
        slot_time = data.get('time')
        token = data.get('lock_token')
        
        if not all([doctor_id, date, slot_time, token]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
            
        # 1. Check if booked
        if Appointment.check_slot_exists(doctor_id, date, slot_time):
            return jsonify({'success': False, 'error': 'Slot is already booked'}), 409
            
        # 2. Check if locked by someone else
        import datetime
        now = datetime.datetime.now()
        expires_at = now + datetime.timedelta(minutes=7)
        expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
        now_str = now.strftime('%Y-%m-%d %H:%M:%S')
        
        check_locked = """
        SELECT lock_token FROM temp_slot_locks 
        WHERE doctor_id = %s AND slot_date = %s AND slot_time = %s AND expires_at > %s
        """
        existing_lock = db.execute_query(check_locked, (str(doctor_id), date, slot_time, now_str), fetch_all=False)
        
        if existing_lock and existing_lock['lock_token'] != token:
            return jsonify({'success': False, 'error': 'Slot is locked by another user'}), 409
            
        # 3. Create or update lock
        lock_query = """
        INSERT INTO temp_slot_locks (doctor_id, slot_date, slot_time, lock_token, expires_at)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (doctor_id, slot_date, slot_time) 
        DO UPDATE SET lock_token = EXCLUDED.lock_token, expires_at = EXCLUDED.expires_at
        """
        db.execute_query(lock_query, (str(doctor_id), date, slot_time, token, expires_str))
        
        return jsonify({
            'success': True,
            'message': 'Slot locked successfully',
            'expires_at': expires_str
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@doctors_bp.route('/slots/unlock', methods=['POST'])
def unlock_slot():
    """Release a slot lock"""
    try:
        data = request.get_json()
        token = data.get('lock_token')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is required'}), 400
            
        query = "DELETE FROM temp_slot_locks WHERE lock_token = %s"
        db.execute_query(query, (token,))
        
        return jsonify({'success': True, 'message': 'Slot unlocked successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
