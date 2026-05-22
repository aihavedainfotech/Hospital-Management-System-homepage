from flask import Blueprint, request, jsonify
from hp_src.modules.appointments.model import Appointment
from hp_src.modules.doctors.model import Doctor
from hp_src.services.whatsapp_service import send_whatsapp_confirmation
import time

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('', methods=['POST'])
def book_appointment():
    """Book a new appointment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['doctor_id', 'patient_name', 'patient_phone', 'patient_age', 'date', 'time']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Check if doctor exists
        doctor = Doctor.get_by_id(data['doctor_id'])
        if not doctor:
            return jsonify({
                'success': False,
                'error': 'Doctor not found'
            }), 404
            
        # Check slot availability (Booking & Lock validation)
        lock_token = data.get('lock_token')
        is_bookable, error = Appointment.is_slot_bookable(data['doctor_id'], data['date'], data['time'], lock_token)
        if not is_bookable:
            return jsonify({
                'success': False,
                'error': error
            }), 409
            
        # Create appointment
        data['doctor_name'] = doctor['name']
        data['department_name'] = doctor.get('department_name') or doctor.get('department')
        data['reference_number'] = f"HVD-APP-{int(time.time() * 1000)}"
        data['payment_amount'] = doctor.get('consultation_fee', 500)
        
        result = Appointment.create(data)
        
        # Trigger WhatsApp notification asynchronously with full details
        try:
            send_whatsapp_confirmation(
                to_phone=data.get('patient_phone'),
                details={
                    'patient_name':     data.get('patient_name'),
                    'doctor_name':      data.get('doctor_name'),
                    'department':       data.get('department_name'),
                    'date':             data.get('date'),
                    'time':             data.get('time'),
                    'visit_type':       data.get('visit_type', 'Consultation'),
                    'fee':              data.get('payment_amount') or doctor.get('consultation_fee'),
                    'patient_id':       result.get('patient_id'),
                    'reference_number': data.get('reference_number'),
                }
            )
        except Exception as e:
            print(f"Failed to queue WhatsApp message: {e}")
        
        # Clear the lock since booking is successful
        if lock_token:
            from ...config.database import db
            db.execute_query("DELETE FROM temp_slot_locks WHERE lock_token = %s", (lock_token,))
        
        return jsonify({
            'success': True,
            'message': 'Appointment booked successfully',
            'reference': result['reference_number'],
            'patient_id': result.get('patient_id'),
            'is_new_patient': data.get('is_new_patient', False)
        }), 201
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"DEBUG: Booking route failed: {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

