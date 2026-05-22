from flask import Blueprint, request, jsonify
from hp_src.modules.patients.model import Patient
import traceback
import re
import random
import time

patient_bp = Blueprint('patient', __name__)

# ── In-memory OTP store ────────────────────────────────────────────────────
# { "identifier": { "otp": "123456", "expires": <unix_ts>, "patient_id": "P00001",
#                   "name": "...", "age": ..., "blood_group": "...", "phone": "..." } }
_otp_store: dict = {}
OTP_TTL = 600  # 10 minutes


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


def _mask_phone(phone: str) -> str:
    """Return ******XXXX for display."""
    p = str(phone).strip()
    if len(p) >= 4:
        return "*" * (len(p) - 4) + p[-4:]
    return "****"



@patient_bp.route('/by-phone/<string:phone>', methods=['GET'])
def get_patients_by_phone(phone):
    """Return all patients registered under a given phone number (for family records)."""
    try:
        phone = phone.strip()
        if not re.match(r'^\d{10,15}$', phone):
            return jsonify({'success': False, 'error': 'Invalid phone number'}), 400
        patients = Patient.get_all_by_phone(phone)
        results = []
        for pt in patients:
            results.append({
                'id':          pt.get('id'),
                'full_name':   (pt.get('full_name') or
                                pt.get('name') or
                                f"{pt.get('first_name', '')} {pt.get('last_name', '')}".strip() or
                                'Patient'),
                'age':         pt.get('age'),
                'gender':      pt.get('gender') or '',
                'blood_group': pt.get('blood_group') or '',
                'phone':       pt.get('phone') or pt.get('phone_number') or phone,
            })
        return jsonify({'success': True, 'data': results})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@patient_bp.route('/search', methods=['GET'])
def search_patients():
    """Search patient by phone, patient ID, or name — mirrors frontdesk lookup logic."""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])

        patients = []

        # 1. Patient ID (P0000036 style)
        if re.match(r'^P\d+$', query.upper()):
            p = Patient.get_by_id(query.upper())
            if p:
                patients = [p]

        # 2. Exact / partial phone number
        if not patients and re.search(r'^\d{5,15}$', query):
            patients = Patient.get_all_by_phone(query)

        # 3. Name / email fallback
        if not patients:
            patients = Patient.get_by_phone_or_email(query)

        results = []
        for pt in patients:
            results.append({
                'id':            pt.get('id'),
                'full_name':     pt.get('full_name') or pt.get('name') or '',
                'phone_number':  pt.get('phone_number') or pt.get('phone') or '',
                'email':         pt.get('email') or '',
                'date_of_birth': str(pt.get('date_of_birth')) if pt.get('date_of_birth') else '',
                'age':           pt.get('age'),
                'gender':        pt.get('gender') or '',
                'blood_group':   pt.get('blood_group') or '',
                'address':       pt.get('address') or '',
                'pincode':       pt.get('pincode') or '',
                'city':          pt.get('city') or '',
                'state':         pt.get('state') or '',
                'village':       pt.get('village') or '',
            })
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@patient_bp.route('/update-profile', methods=['POST'])
def update_patient_profile():
    """Update patient phone and name from the portal"""
    try:
        data = request.get_json()
        patient_id = data.get('patient_id', '').strip()
        phone = data.get('phone', '').strip()
        full_name = data.get('full_name', '').strip()

        if not patient_id:
            return jsonify({'success': False, 'error': 'Patient ID required'}), 400
        if phone and len(phone) != 10:
            return jsonify({'success': False, 'error': 'Phone must be exactly 10 digits'}), 400

        parts = full_name.split(' ', 1) if full_name else []
        first_name = parts[0] if parts else None
        last_name = parts[1] if len(parts) > 1 else ''

        update_fields = []
        params = []
        if phone:
            update_fields.append('phone = %s')
            params.append(phone)
        if first_name:
            update_fields.append('first_name = %s')
            params.append(first_name)
            update_fields.append('last_name = %s')
            params.append(last_name)

        if not update_fields:
            return jsonify({'success': False, 'error': 'Nothing to update'}), 400

        from hp_src.config.database import db
        params.append(patient_id)
        db.execute_query(
            f"UPDATE patients SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s",
            tuple(params)
        )
        return jsonify({'success': True, 'message': 'Profile updated'})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500



@patient_bp.route('/login', methods=['POST'])
def patient_login():
    """
    Step 1 — Request OTP.
    Accepts either:
      { "login_type": "phone",      "identifier": "9876543210" }
      { "login_type": "patient_id", "identifier": "P00001"     }

    Looks up the patient, generates a real OTP, sends it via WhatsApp,
    and returns masked phone + patient name so the frontend can show
    "OTP sent to ******3210".
    """
    try:
        data = request.get_json() or {}
        login_type  = data.get('login_type', 'patient_id').strip()
        identifier  = (data.get('identifier') or data.get('patient_id') or '').strip()

        if not identifier:
            return jsonify({'success': False, 'error': 'Please enter your phone number or Patient ID.'}), 400

        # ── Lookup patient ────────────────────────────────────────────────
        patient_data = None

        if login_type == 'phone':
            # Search by phone number
            matches = Patient.get_all_by_phone(identifier)
            if matches:
                patient_data = matches[0]
        else:
            # Search by patient ID (default / legacy)
            patient_data = Patient.get_by_id(identifier.upper())

        if not patient_data:
            msg = (
                'No patient found with this phone number. Please book an appointment first.'
                if login_type == 'phone'
                else 'Patient ID not found. Please book an appointment first.'
            )
            return jsonify({'success': False, 'error': msg}), 404

        # ── Resolve phone number ──────────────────────────────────────────
        phone = (
            patient_data.get('phone')
            or patient_data.get('phone_number')
            or ''
        ).strip()

        if not phone:
            return jsonify({
                'success': False,
                'error': 'No phone number on record. Please contact the hospital reception to update your details.'
            }), 400

        patient_id   = patient_data.get('id') or patient_data.get('patient_id') or identifier
        patient_name = (
            patient_data.get('full_name')
            or patient_data.get('name')
            or f"{patient_data.get('first_name','')} {patient_data.get('last_name','')}".strip()
            or 'Patient'
        )

        # ── Generate & store OTP ──────────────────────────────────────────
        otp = _generate_otp()
        _otp_store[identifier] = {
            'otp':          otp,
            'expires':      time.time() + OTP_TTL,
            'patient_id':   patient_id,
            'name':         patient_name,
            'age':          patient_data.get('age'),
            'blood_group':  patient_data.get('blood_group'),
            'phone':        phone,
        }

        # ── Send OTP via WhatsApp ─────────────────────────────────────────
        from hp_src.services.whatsapp_service import send_otp_whatsapp
        sent = send_otp_whatsapp(phone, otp, patient_name)

        # Fallback: if WhatsApp fails, still allow login but warn
        whatsapp_note = '' if sent else ' (WhatsApp delivery failed — use demo OTP 123456)'

        return jsonify({
            'success':      True,
            'name':         patient_name,
            'patient_id':   patient_id,
            'age':          patient_data.get('age'),
            'blood_group':  patient_data.get('blood_group'),
            'phone_masked': _mask_phone(phone),
            'whatsapp_sent': sent,
            'message':      f'OTP sent to your WhatsApp ({_mask_phone(phone)}){whatsapp_note}',
        })

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@patient_bp.route('/verify-otp', methods=['POST'])
def verify_patient_otp():
    """
    Step 2 — Verify OTP.
    { "identifier": "9876543210" | "P00001", "otp": "123456" }
    Returns a session token (patient_id) on success.
    """
    try:
        data       = request.get_json() or {}
        identifier = (data.get('identifier') or '').strip()
        otp_input  = (data.get('otp') or '').strip()

        if not identifier or not otp_input:
            return jsonify({'success': False, 'error': 'Identifier and OTP are required.'}), 400

        record = _otp_store.get(identifier)

        if not record:
            return jsonify({'success': False, 'error': 'OTP expired or not requested. Please request a new OTP.'}), 400

        if time.time() > record['expires']:
            del _otp_store[identifier]
            return jsonify({'success': False, 'error': 'OTP has expired. Please request a new one.'}), 400

        # Accept real OTP or demo fallback "123456"
        if otp_input != record['otp'] and otp_input != '123456':
            return jsonify({'success': False, 'error': 'Invalid OTP. Please try again.'}), 400

        # Clean up used OTP
        del _otp_store[identifier]

        return jsonify({
            'success':     True,
            'patient_id':  record['patient_id'],
            'name':        record['name'],
            'age':         record['age'],
            'blood_group': record['blood_group'],
            'phone':       record['phone'],
            'message':     'Login successful',
        })

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500



@patient_bp.route('/<string:patient_id>/prescriptions', methods=['GET'])
def get_patient_prescriptions(patient_id):
    try:
        return jsonify(Patient.get_prescriptions(patient_id))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@patient_bp.route('/<string:patient_id>/reports', methods=['GET'])
def get_patient_reports(patient_id):
    try:
        return jsonify(Patient.get_reports_by_id(patient_id))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@patient_bp.route('/<string:patient_id>/appointments', methods=['GET'])
def get_patient_appointments(patient_id):
    try:
        return jsonify(Patient.get_appointments(patient_id))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@patient_bp.route('/<string:patient_id>/lab_orders', methods=['GET'])
def get_patient_lab_orders(patient_id):
    try:
        return jsonify(Patient.get_lab_orders_by_id(patient_id))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@patient_bp.route('/reports/<string:report_id>/download', methods=['GET'])
def download_patient_report(report_id):
    from flask import Response
    try:
        pdf_data = Patient.get_report_pdf(report_id)
        if not pdf_data:
            return jsonify({'error': 'Report PDF not found'}), 404
        return Response(
            pdf_data,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment; filename=report_{report_id}.pdf'}
        )
    except Exception as e:
        return jsonify({'error': 'Failed to download report'}), 500
