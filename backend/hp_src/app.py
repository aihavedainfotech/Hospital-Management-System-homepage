from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
load_dotenv()
from hp_src.modules.doctors.routes import doctors_bp
from hp_src.modules.departments.routes import departments_bp
from hp_src.modules.content.event_routes import events_bp
from hp_src.modules.feedback.routes import complaints_bp, suggestions_bp, compliments_bp
from hp_src.modules.content.achievement_routes import achievements_bp
from hp_src.modules.appointments.routes import appointments_bp
from hp_src.modules.patients.routes import patient_bp
from hp_src.modules.chatbot.routes import chatbot_bp
from hp_src.modules.appointments.cancellation_routes import cancellation_bp

app = Flask(__name__)
CORS(app, 
    origins=[
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
        'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176'
    ],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization'],
    supports_credentials=True
)

# Register blueprints
app.register_blueprint(doctors_bp)
app.register_blueprint(departments_bp)
app.register_blueprint(events_bp)
app.register_blueprint(complaints_bp)
app.register_blueprint(suggestions_bp)
app.register_blueprint(compliments_bp)
app.register_blueprint(achievements_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(cancellation_bp)

from datetime import datetime
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'service': 'Haveda Hospital API - Flask Version',
        'version': '1.0.0'
    })

@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'Haveda Hospital API',
        'version': '1.0.0',
        'framework': 'Flask',
        'endpoints': {
            'doctors': '/api/doctors',
            'departments': '/api/departments',
            'events': '/api/events',
            'complaints': '/api/complaints',
            'achievements': '/api/achievements',
            'appointments': '/api/appointments',
            'patient': '/api/patient',
            'ticker': '/api/ticker'
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Haveda Hospital Flask API Server...")
    print("Database: PostgreSQL (Supabase)")
    print("Server: http://localhost:5000")
    print("API Docs: http://localhost:5000/api")
    try:
        app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Trying alternative configuration...")
        app.run(debug=True, host='0.0.0.0', port=5000)
