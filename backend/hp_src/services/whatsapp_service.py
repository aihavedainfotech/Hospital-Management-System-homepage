import os
import json
import requests
import threading
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def send_whatsapp_confirmation_sync(to_phone: str, details: dict):
    """
    Sends a WhatsApp message via official Meta WhatsApp Cloud API synchronously.
    details should have: doctor_name, date, time, patient_name, reference_number,
                         department, fee, patient_id (all optional except core fields)
    """
    access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
    phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
    
    if not access_token or not phone_number_id:
        logger.warning("Meta WhatsApp API credentials missing in .env (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID). Skipping WhatsApp notification.")
        return False
        
    # Format phone number perfectly (removing '+' if present)
    to_number = str(to_phone).strip()
    if to_number.startswith("+"):
        to_number = to_number[1:]
    
    # Remove leading 0 if present (common in Indian local format)
    if to_number.startswith("0"):
        to_number = to_number[1:]
    
    # Optional fallback for India if exactly 10 digits
    if to_number.isdigit() and len(to_number) == 10:
        to_number = f"91{to_number}"

    # Build rich message with all available details
    patient_name    = details.get('patient_name', 'Patient')
    doctor_name     = details.get('doctor_name', 'N/A')
    date_str        = details.get('date', 'N/A')
    time_str        = details.get('time', 'N/A')
    ref_no          = details.get('reference_number', 'N/A')
    department      = details.get('department') or details.get('department_name', '')
    fee             = details.get('fee') or details.get('payment_amount') or details.get('consultation_fee', '')
    patient_id      = details.get('patient_id', '')
    visit_type      = details.get('visit_type', 'Consultation')

    lines = [
        "✅ *Appointment Confirmed — Haveda Hospital*",
        "",
        f"Dear *{patient_name}*,",
        "Your appointment has been successfully booked.",
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        f"👨‍⚕️ *Doctor*: {doctor_name}",
    ]
    if department:
        lines.append(f"🏥 *Department*: {department}")
    lines += [
        f"📅 *Date*: {date_str}",
        f"⏰ *Time*: {time_str}",
        f"🩺 *Visit Type*: {visit_type}",
    ]
    if fee:
        lines.append(f"💰 *Consultation Fee*: ₹{fee}")
    if patient_id:
        lines.append(f"🪪 *Patient ID*: {patient_id}")
    lines += [
        f"📝 *Reference No*: {ref_no}",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "⏱ Please arrive *15 minutes* before your scheduled time.",
        "📞 For queries, contact Haveda Hospital reception.",
        "",
        "_This is an automated message. Please do not reply._"
    ]

    message_body = "\n".join(lines)
    
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_body
        }
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        
        # Log all responses to a dedicated file for debugging
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        log_path = os.path.join(log_dir, 'whatsapp.log')
        
        with open(log_path, 'a') as f:
            f.write(f"\n[{datetime.now()}] To: {to_number} | Status: {response.status_code}\n")
            f.write(f"Response: {response.text}\n")
            f.write("-" * 50 + "\n")

        if response.status_code in [200, 201]:
            logger.info(f"WhatsApp confirmation sent successfully via Meta API to {to_number}")
            return True
        else:
            logger.error(f"Meta API Error: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return False

def send_whatsapp_confirmation(to_phone: str, details: dict):
    """
    Wraps the synchronous call in a daemon thread so the API response isn't blocked,
    allowing the frontend booking to appear instantly.
    """
    thread = threading.Thread(target=send_whatsapp_confirmation_sync, args=(to_phone, details))
    thread.daemon = True
    thread.start()


def _format_phone(phone: str) -> str:
    """Normalise phone to E.164 without leading +, e.g. 919876543210"""
    num = str(phone).strip()
    if num.startswith("+"):
        num = num[1:]
    if num.startswith("0"):
        num = num[1:]
    if num.isdigit() and len(num) == 10:
        num = f"91{num}"
    return num


def send_otp_whatsapp(to_phone: str, otp: str, patient_name: str = "Patient") -> bool:
    """
    Send a 6-digit OTP to the patient via WhatsApp (Meta Cloud API).
    Returns True on success, False on failure.
    """
    access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
    phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')

    if not access_token or not phone_number_id:
        logger.warning("WhatsApp credentials missing — cannot send OTP.")
        return False

    to_number = _format_phone(to_phone)

    message_body = (
        f"🔐 *Haveda Hospital — Login OTP*\n\n"
        f"Dear {patient_name},\n\n"
        f"Your one-time password is:\n\n"
        f"*{otp}*\n\n"
        f"This OTP is valid for *10 minutes*. Do not share it with anyone.\n\n"
        f"If you did not request this, please ignore this message."
    )

    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "text",
        "text": {"preview_url": False, "body": message_body}
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)

        # Log to whatsapp.log
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, 'whatsapp.log')
        with open(log_path, 'a') as f:
            f.write(f"\n[{datetime.now()}] OTP to: {to_number} | Status: {response.status_code}\n")
            f.write(f"Response: {response.text}\n")
            f.write("-" * 50 + "\n")

        if response.status_code in [200, 201]:
            logger.info(f"OTP sent via WhatsApp to {to_number}")
            return True
        else:
            logger.error(f"WhatsApp OTP error: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send OTP WhatsApp: {e}")
        return False
