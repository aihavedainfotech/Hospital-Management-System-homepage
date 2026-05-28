from flask import Blueprint, request, jsonify
from hp_src.modules.appointments.model import Appointment
cancellation_bp = Blueprint('cancellation', __name__)

@cancellation_bp.route('/search', methods=['GET'])
def search_appointments():
    """Search active appointments by phone number and date"""
    try:
        phone = request.args.get('phone')
        date = request.args.get('date')
        
        if not phone or not date:
            return jsonify({
                'success': False,
                'error': 'Phone number and date are required'
            }), 400
            
        appointments = Appointment.get_by_phone_date(phone, date)
        return jsonify({
            'success': True,
            'data': appointments
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@cancellation_bp.route('/cancel', methods=['POST'])
def cancel_appointment():
    """Cancel an appointment and move it to the cancelled table"""
    try:
        data = request.get_json()
        appointment_id = data.get('id')
        reason = data.get('reason', 'No reason provided')
        
        if not appointment_id:
            return jsonify({
                'success': False,
                'error': 'Appointment ID is required'
            }), 400
            
        success = Appointment.cancel_and_move(appointment_id, reason)
        if success:
            return jsonify({
                'success': True,
                'message': 'Appointment cancelled successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to cancel appointment. It may not exist or is already cancelled.'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@cancellation_bp.route('/reschedule', methods=['PUT'])
def reschedule_appointment():
    """Update an appointment's date and time"""
    try:
        data = request.get_json()
        appointment_id = data.get('id')
        new_date = data.get('date')
        new_time = data.get('time')
        lock_token = data.get('lock_token')
        
        import sys
        print(f"DEBUG: Rescheduling {appointment_id} to {new_date} {new_time} (Token: {lock_token})", file=sys.stderr)
        
        if not all([appointment_id, new_date, new_time]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
            
        # 1. Get doctor_id
        appt = Appointment.get_by_id(appointment_id)
        if not appt:
            return jsonify({'success': False, 'error': f'Appointment {appointment_id} not found'}), 404
            
        new_doctor_id = data.get('doctor_id') or appt['doctor_id']
        
        # 2. Validate slot availability
        is_bookable, error = Appointment.is_slot_bookable(new_doctor_id, new_date, new_time, lock_token)
        if not is_bookable:
            print(f"DEBUG: Slot not bookable: {error}", file=sys.stderr)
            return jsonify({
                'success': False,
                'error': error
            }), 409
            
        # 3. Perform update
        success = Appointment.update_slot(appointment_id, new_date, new_time, new_doctor_id)
        if success:
            if lock_token:
                try:
                    from config.database import db
                    db.execute_query("DELETE FROM temp_slot_locks WHERE lock_token = %s", (lock_token,))
                except: pass
            return jsonify({
                'success': True,
                'message': 'Appointment rescheduled successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Update failed in database'
            }), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
