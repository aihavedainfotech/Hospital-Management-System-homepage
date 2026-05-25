import requests

# Test slots lock
try:
    res = requests.post("http://localhost:5001/api/homepage/doctors/slots/lock", json={
        "doctor_id": 2,
        "date": "2026-05-29",
        "time": "10:00 AM",
        "lock_token": "token123"
    })
    print("LOCK RESPONSE:", res.status_code, res.text)
except Exception as e:
    print("LOCK FAILED:", e)

# Test appointments
try:
    res = requests.post("http://localhost:5001/api/homepage/appointments", json={
        "doctor_id": 2,
        "patient_name": "Test User",
        "patient_phone": "1234567890",
        "patient_age": 30,
        "date": "2026-05-29",
        "time": "10:00 AM"
    })
    print("APPT RESPONSE:", res.status_code, res.text)
except Exception as e:
    print("APPT FAILED:", e)
