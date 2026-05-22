"""
=============================================================
  HOMEPAGE BACKEND — Standalone Flask Server (Port 5001)
  Fully independent from main HMS backend (Port 5000)
=============================================================
"""

import os
import sys

# ── Make hp_src importable from this folder ─────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime

# Load .env from this backend directory
load_dotenv(os.path.join(_BASE, ".env"))

# ── App ──────────────────────────────────────────────────────────
app = Flask(__name__)

CORS(app,
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "http://localhost:5173",
         "http://127.0.0.1:5173",
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True,
     )

# ── Register all homepage blueprints ────────────────────────────
from hp_src.modules.doctors.routes          import doctors_bp
from hp_src.modules.departments.routes      import departments_bp
from hp_src.modules.content.event_routes    import events_bp
from hp_src.modules.content.achievement_routes import achievements_bp
from hp_src.modules.feedback.routes         import complaints_bp, suggestions_bp, compliments_bp
from hp_src.modules.appointments.routes     import appointments_bp
from hp_src.modules.appointments.cancellation_routes import cancellation_bp
from hp_src.modules.patients.routes         import patient_bp
from hp_src.modules.chatbot.routes          import chatbot_bp

app.register_blueprint(doctors_bp, url_prefix='/api/homepage/doctors')
app.register_blueprint(departments_bp, url_prefix='/api/homepage/departments')
app.register_blueprint(events_bp, url_prefix='/api/homepage/events')
app.register_blueprint(achievements_bp, url_prefix='/api/homepage/achievements')
app.register_blueprint(complaints_bp, url_prefix='/api/homepage/complaints')
app.register_blueprint(suggestions_bp, url_prefix='/api/homepage/suggestions')
app.register_blueprint(compliments_bp, url_prefix='/api/homepage/compliments')
app.register_blueprint(appointments_bp, url_prefix='/api/homepage/appointments')
app.register_blueprint(cancellation_bp, url_prefix='/api/homepage/cancellations')
app.register_blueprint(patient_bp, url_prefix='/api/homepage/patients')
app.register_blueprint(chatbot_bp, url_prefix='/api/homepage/chatbot')

# ── Health check ─────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status":    "healthy",
        "service":   "Homepage Backend",
        "port":      5001,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    })

@app.route("/api", methods=["GET"])
def api_info():
    return jsonify({
        "name":    "HMS Homepage API",
        "version": "2.0.0",
        "port":    5001,
        "endpoints": {
            "doctors":      "/api/doctors",
            "departments":  "/api/departments",
            "events":       "/api/events",
            "achievements": "/api/achievements",
            "appointments": "/api/appointments",
            "patients":     "/api/patient",
            "chatbot":      "/api/chatbot",
            "complaints":   "/api/complaints",
            "suggestions":  "/api/suggestions",
            "compliments":  "/api/compliments",
            "health":       "/api/health",
        },
    })

# ── Error handlers ────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found", "status": 404}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error", "status": 500}), 500
