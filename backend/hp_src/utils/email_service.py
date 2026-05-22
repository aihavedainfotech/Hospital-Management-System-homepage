import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def _send_email(to_email, subject, body_text):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print("Missing SMTP configuration.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_text, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_complaint_acknowledgment(email, name, cid, message):
    subject = f"Complaint Received - Reference {cid}"
    body = f"Dear {name},\n\nWe have received your complaint (ID: {cid}).\n\nYour message:\n{message}\n\nOur team will review it shortly.\n\nBest regards,\nHMS Team"
    return _send_email(email, subject, body)

def send_compliment_acknowledgment(email, name, cid, message):
    subject = f"Thank You for Your Compliment!"
    body = f"Dear {name},\n\nThank you so much for your kind words! We really appreciate your feedback.\n\nYour message:\n{message}\n\nBest regards,\nHMS Team"
    return _send_email(email, subject, body)

def send_suggestion_acknowledgment(email, name, sid, message):
    subject = f"Suggestion Received - Reference {sid}"
    body = f"Dear {name},\n\nWe have received your suggestion (ID: {sid}). We are always looking to improve!\n\nYour message:\n{message}\n\nBest regards,\nHMS Team"
    return _send_email(email, subject, body)
