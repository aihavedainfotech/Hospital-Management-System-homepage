import logging
import os
import json
from flask import Blueprint, request, jsonify
from hp_src.services.chatbot_service import agent, transcribe_audio_ai4bharat, normalize_time
from hp_src.modules.doctors.model import Doctor
from hp_src.modules.appointments.model import Appointment
from hp_src.modules.doctors.routes import generate_slots_from_timings, is_day_available

logging.basicConfig(
    filename=os.path.join(os.getcwd(), 'chatbot_debug.log'),
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/text', methods=['POST'])
def handle_text():
    logging.debug("/api/chatbot/text hit")
    data = request.get_json(silent=True) or {}
    user_text = data.get('text', '').strip()
    language = data.get('language', 'English')
    logging.debug(f"User Text: '{user_text}', Language: {language}")
    if not user_text: 
        return jsonify({'error': 'Empty'}), 400
    
    response_text = agent.process_query(user_text, data.get('history', []), language=language)
    return jsonify({
        'success': True, 
        'response': response_text
    })

@chatbot_bp.route('/voice', methods=['POST'])
def handle_voice():
    if 'audio' not in request.files: 
        return jsonify({'error': 'No audio'}), 400
        
    audio_file = request.files['audio']
    language = request.form.get('language', 'en')
    
    try: 
        history = json.loads(request.form.get('history', '[]'))
    except: 
        history = []
    
    try:
        user_text = transcribe_audio_ai4bharat(audio_file.read(), language)
        if not user_text: 
            return jsonify({'error': 'No transcript'}), 400
            
        # Map voice code to language name for LLM
        lang_name = {
            'hi-IN': 'Hindi',
            'te-IN': 'Telugu',
            'ta-IN': 'Tamil',
            'ml-IN': 'Malayalam',
            'kn-IN': 'Kannada',
            'en-US': 'English'
        }.get(language, 'English')
        
        response_text = agent.process_query(user_text, history, language=lang_name)
        return jsonify({
            'success': True,
            'transcript': user_text,
            'response': response_text
        })
    except Exception as e: 
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/slots', methods=['GET'])
def get_slots():
    """Return available time slots for a doctor on a given date (used by frontend calendar picker)."""
    doctor_name = request.args.get('doctor_name', '').strip()
    date_str = request.args.get('date', '').strip()

    if not date_str:
        return jsonify({'slots': [], 'error': 'date required'}), 400

    try:
        def clean(n):
            return n.lower().replace('dr.', '').replace('dr', '').strip()

        all_docs = Doctor.get_all()
        doctor = None
        if doctor_name:
            target = clean(doctor_name)
            doctor = next((d for d in all_docs if target in clean(d['name'])), None)

        if not doctor:
            # No doctor context — return generic 30-min slots 9 AM to 5 PM
            slots = []
            for h in range(9, 17):
                for m in [0, 30]:
                    ampm = 'AM' if h < 12 else 'PM'
                    h12 = h % 12 or 12
                    slots.append(f"{h12}:{m:02d} {ampm}")
            return jsonify({'slots': slots, 'available_days': 'Everyday', 'timings': '9 AM - 5 PM'})

        if not is_day_available(doctor.get('available_days'), date_str):
            return jsonify({
                'slots': [],
                'message': f"Doctor not available on {date_str}",
                'available_days': doctor.get('available_days', 'Everyday'),
                'timings': doctor.get('timings', '')
            })

        all_slots = generate_slots_from_timings(doctor.get('timings'))
        booked = Appointment.get_by_doctor_date(doctor['id'], date_str)
        booked_times = {normalize_time(a['time']) for a in booked if a.get('status') != 'Cancelled'}

        available = []
        from datetime import datetime, date as dt_date
        today = dt_date.today()
        now = datetime.now().time()

        for s in all_slots:
            norm = normalize_time(s['time'])
            if norm in booked_times:
                continue
            # Filter past slots for today
            try:
                slot_time = datetime.strptime(norm, "%I:%M %p").time()
                if date_str == today.isoformat() and slot_time <= now:
                    continue
            except:
                pass
            available.append(norm)

        return jsonify({
            'slots': available,
            'doctor': doctor['name'],
            'available_days': doctor.get('available_days', 'Everyday'),
            'timings': doctor.get('timings', '')
        })

    except Exception as e:
        logging.error(f"Slots error: {e}")
        return jsonify({'slots': [], 'error': str(e)}), 500

@chatbot_bp.route('/doctor-info', methods=['GET'])
def get_doctor_info():
    """Return doctor availability info (available_days, timings) for the calendar picker."""
    doctor_name = request.args.get('doctor_name', '').strip()
    if not doctor_name:
        return jsonify({'available_days': 'Everyday', 'timings': '9 AM - 5 PM'})
    try:
        def clean(n):
            return n.lower().replace('dr.', '').replace('dr', '').strip()
        all_docs = Doctor.get_all()
        target = clean(doctor_name)
        doctor = next((d for d in all_docs if target in clean(d['name'])), None)
        if not doctor:
            return jsonify({'available_days': 'Everyday', 'timings': '9 AM - 5 PM', 'found': False})
        return jsonify({
            'found': True,
            'name': doctor['name'],
            'available_days': doctor.get('available_days', 'Everyday'),
            'timings': doctor.get('timings', '9 AM - 5 PM'),
            'consultation_fee': doctor.get('consultation_fee')
        })
    except Exception as e:
        return jsonify({'available_days': 'Everyday', 'timings': '9 AM - 5 PM', 'error': str(e)})

@chatbot_bp.route('/debug_env', methods=['GET'])
def debug_env():
    return jsonify({
        'GEMINI_API_KEY_EXISTS': bool(os.getenv('GEMINI_API_KEY')),
        'GEMINI_PREFIX': os.getenv('GEMINI_API_KEY')[:8] if os.getenv('GEMINI_API_KEY') else 'NONE',
        'CWD': os.getcwd()
    })


@chatbot_bp.route('/health-tip', methods=['GET'])
def get_health_tip():
    """Return a daily AI-generated health tip using Groq API."""
    import random
    from datetime import date as dt_date

    groq_key = os.getenv('GROQ_API_KEY', '').strip()

    # Fallback tips if Groq key is missing or call fails
    fallback_tips = [
        "Walking for just 30 minutes a day can significantly improve your cardiovascular health and mood.",
        "Drinking 8 glasses of water daily keeps your body hydrated and supports kidney function.",
        "Getting 7–8 hours of sleep each night helps your body repair and strengthens your immune system.",
        "Eating a rainbow of vegetables ensures you get a wide range of essential vitamins and minerals.",
        "Deep breathing for 5 minutes a day can reduce stress and lower blood pressure naturally.",
        "Washing your hands regularly is one of the most effective ways to prevent infections.",
        "Limiting screen time before bed improves sleep quality and reduces eye strain.",
        "A 10-minute morning stretch routine can improve flexibility and reduce muscle tension throughout the day.",
    ]

    if not groq_key or groq_key == 'YOUR_GROQ_API_KEY_HERE':
        # Use a deterministic daily tip from fallback list
        day_index = dt_date.today().toordinal() % len(fallback_tips)
        return jsonify({'success': True, 'tip': fallback_tips[day_index], 'source': 'fallback'})

    try:
        import requests as req
        today = dt_date.today().isoformat()
        topics = ["nutrition", "exercise", "sleep", "mental health", "hydration", "preventive care", "heart health", "immunity"]
        topic = topics[dt_date.today().toordinal() % len(topics)]

        response = req.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a health expert. Provide a single, concise, practical daily health tip. Keep it to 1-2 sentences. No bullet points, no headers, no markdown. Just the tip text."
                    },
                    {
                        "role": "user",
                        "content": f"Give me a health tip for today ({today}) about {topic}."
                    }
                ],
                "max_tokens": 100,
                "temperature": 0.7
            },
            timeout=8
        )

        if response.status_code == 200:
            tip = response.json()['choices'][0]['message']['content'].strip().strip('"')
            return jsonify({'success': True, 'tip': tip, 'source': 'groq'})
        else:
            day_index = dt_date.today().toordinal() % len(fallback_tips)
            return jsonify({'success': True, 'tip': fallback_tips[day_index], 'source': 'fallback'})

    except Exception as e:
        logging.error(f"Health tip Groq error: {e}")
        day_index = dt_date.today().toordinal() % len(fallback_tips)
        return jsonify({'success': True, 'tip': fallback_tips[day_index], 'source': 'fallback'})

