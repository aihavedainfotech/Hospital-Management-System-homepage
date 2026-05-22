import os
import re
import json
import time
import requests
import logging
from openai import OpenAI
from datetime import datetime, date
from typing import Dict, Any, List, Optional
import tempfile
import traceback

logger = logging.getLogger(__name__)

# Global flag for whisper availability
HAS_WHISPER = True
try:
    import whisper
except ImportError:
    HAS_WHISPER = False
    print("[ChatBot] Warning: whisper library not found. Voice transcription will be disabled.")

# Import models
from hp_src.modules.doctors.model import Doctor
from hp_src.modules.departments.model import Department
from hp_src.modules.appointments.model import Appointment
from hp_src.modules.feedback.model import Complaint
from hp_src.modules.doctors.routes import generate_slots_from_timings, is_day_available
from hp_src.services.whatsapp_service import send_whatsapp_confirmation

HOSPITAL_PHONE = os.getenv('HOSPITAL_PHONE', '7993376939')
HOSPITAL_NAME  = os.getenv('HOSPITAL_NAME', 'Haveda Hospital')
HF_TOKEN       = os.getenv("HF_TOKEN", "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")

print(f"DEBUG: chatbot_service.py LOADED AT {datetime.now()}")

_whisper_model = None

def transcribe_audio_ai4bharat(audio_bytes: bytes, language: str = "en") -> str:
    global _whisper_model
    try:
        if _whisper_model is None:
            import whisper
            print("[Whisper] Loading base model...")
            _whisper_model = whisper.load_model("base")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        print(f"[Whisper] Transcribing {len(audio_bytes)} bytes in {language}...")
        # Whisper expects ISO 639-1 (2-letter) codes, e.g. 'hi' instead of 'hi-IN'
        whisper_lang = language.split('-')[0] if '-' in language else language
        result = _whisper_model.transcribe(tmp_path, language=whisper_lang if whisper_lang != "auto" else None)
        os.unlink(tmp_path)
        return result.get("text", "").strip()
    except Exception as e:
        print(f"[Whisper] Error: {e}")
        return ""

# ─────────────────────────────────────────────
#  TOOL FUNCTIONS (called by the LLM dispatcher)
# ─────────────────────────────────────────────

def list_doctors(department: Optional[str] = None) -> str:
    try:
        doctors = Doctor.get_by_department(department) if department else Doctor.get_all()
        if not doctors:
            scope = f"in **{department}**" if department else "at the hospital"
            return f"No doctors found {scope}."
        lines = []
        for d in doctors:
            name = d['name'] if d['name'].lower().startswith('dr.') else f"Dr. {d['name']}"
            fee_info = f" | Fee: ₹{d.get('consultation_fee', 'N/A')}" if d.get('consultation_fee') else ""
            lines.append(f"• {name} | {d.get('specialization','N/A')} | {d.get('department','N/A')}{fee_info}")
        header = f"Doctors in **{department}**:" if department else "All available doctors:"
        return header + "\n" + "\n".join(lines)
    except Exception as e:
        return f"Error fetching doctors: {e}"

def list_departments() -> str:
    try:
        departments = Department.get_all()
        if not departments:
            return "No departments found."
        lines = [f"• **{d['name']}** ({d.get('doctor_count', 0)} doctors)" for d in departments]
        return "Our hospital departments:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error fetching departments: {e}"

# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def normalize_time(t):
    """Robust time normalization to 'HH:MM AM/PM' format."""
    if hasattr(t, 'strftime'):
        return t.strftime("%I:%M %p").lstrip("0")
    t_str = str(t).strip().upper()
    if "AM" in t_str or "PM" in t_str:
        return t_str.lstrip("0")
    try:
        # Handle HH:MM:SS format
        parts = t_str.split(":")
        h = int(parts[0])
        m = int(parts[1])
        ampm = "AM" if h < 12 else "PM"
        h12 = h % 12 or 12
        return f"{h12}:{m:02d} {ampm}"
    except:
        return t_str

def get_doctor_availability(doctor_name: str, date: str) -> str:
    date_str = date
    try:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return "Please use YYYY-MM-DD format (e.g. 2026-03-25)."
        def clean_doc_name(n):
            return n.lower().replace("dr.", "").replace("dr", "").strip()

        target_clean = clean_doc_name(doctor_name)
        all_docs = Doctor.get_all()
        doctor = next((d for d in all_docs if target_clean in clean_doc_name(d['name'])), None)
        
        if not doctor:
            return f"Doctor '{doctor_name}' not found. Try 'list doctors' first."
        disp = doctor['name'] if doctor['name'].lower().startswith('dr.') else f"Dr. {doctor['name']}"
        fee_info = f" (Consultation Fee: ₹{doctor.get('consultation_fee')})" if doctor.get('consultation_fee') else ""
        
        if not is_day_available(doctor.get('available_days'), date_str):
            return f"{disp} is NOT available on {date_str}."
        
        all_slots = generate_slots_from_timings(doctor.get('timings'))
        booked = Appointment.get_by_doctor_date(doctor['id'], date_str)
        
        booked_times = {normalize_time(a['time']) for a in booked if a.get('status') != 'Cancelled'}
        available = []
        for s in all_slots:
            normalized_slot = normalize_time(s['time'])
            if normalized_slot not in booked_times:
                available.append(s['time'])
                
        if not available:
            return f"{disp} is fully booked on {date_str}."
            
        return (f"Available slots for {disp}{fee_info} on {date_str}:\n" +
                "\n".join(f"  ✓ {s}" for s in available) +
                f"\n\nTo book, say: 'Book {disp} on {date_str} at [time] for [Patient Name], Phone: [Number]'")
    except Exception as e:
        return f"Error: {e}"

def book_hospital_appointment(doctor_name: str, date: str, time: str,
                               patient_name: str, phone: str, age: int = 30) -> str:
    date_str = date
    time_slot = time
    print(f"🔥 BOOKING FUNCTION CALLED")
    print(f"DATA: Doctor='{doctor_name}', Date='{date_str}', Time='{time_slot}', Patient='{patient_name}', Phone='{phone}'")
    
    if not time_slot or str(time_slot).lower() == "none":
        return "I need a specific time for the appointment (e.g., 10:00 AM). Could you please provide your preferred time?"
    if not patient_name or str(patient_name).lower() == "patient":
        return "Whom should I book the appointment for? Please provide the patient's full name."
    if not phone or str(phone).lower() == "9999999999":
        return "Please provide a valid phone number for the booking."

    try:
        def clean_doc_name(n):
            return n.lower().replace("dr.", "").replace("dr", "").strip()

        target_clean = clean_doc_name(doctor_name)
        all_docs = Doctor.get_all()
        doctor = next((d for d in all_docs if target_clean in clean_doc_name(d['name'])), None)

        if not doctor:
            print(f"❌ Doctor '{doctor_name}' not found during tool execution.")
            return f"Doctor '{doctor_name}' not found."
        
        # 🔥 STRICT RANGE & DAY VALIDATION
        days_avail = doctor.get('available_days', 'Everyday')
        timings_str = doctor.get('timings', '10 AM - 7 PM')
        
        if not is_day_available(days_avail, date_str):
            print(f"❌ DAY INVALID: {date_str} for {doctor['name']} ({days_avail})")
            return f"I'm sorry, but Dr. {doctor['name']} is only available on: {days_avail}. Please choose another day."
        
        valid_slots = [normalize_time(s['time']) for s in generate_slots_from_timings(timings_str)]
        requested_norm = normalize_time(time_slot)
        
        if requested_norm not in valid_slots:
            print(f"❌ SLOT OUT OF RANGE: Requested {requested_norm}, Valid: {valid_slots[:2]}...{valid_slots[-1:]}")
            return f"Invalid time: {time_slot}. Dr. {doctor['name']} is only available between {timings_str}. Please choose a time within this range."

        # 🔥 SLOT CONFLICT CHECK
        booked = Appointment.get_by_doctor_date(doctor['id'], date_str)
        booked_times = {normalize_time(a['time']) for a in booked if a.get('status') != 'Cancelled'}
        
        if requested_norm in booked_times:
            print(f"❌ SLOT CONFLICT: {requested_norm} already booked for {doctor['name']}")
            return f"I'm sorry, but the {time_slot} slot for Dr. {doctor['name']} on {date_str} is already filled. Please choose another time or day."

        disp = doctor['name'] if doctor['name'].lower().startswith('dr.') else f"Dr. {doctor['name']}"
        appt_data = {
            'doctor_id': doctor['id'], 'doctor_name': disp,
            'patient_name': patient_name, 'patient_phone': phone, 'patient_age': age,
            'date': date_str, 'time': time_slot,
            'reference_number': f"AI-{int(datetime.now().timestamp())}",
            'department_name': doctor.get('department_name') or doctor.get('department'),
            'type': 'Consultation',
            'status': 'pending',
            'payment_amount': doctor.get('consultation_fee', 500)
        }
        print(f"🔥 INSERTING DOCTOR_ID: {doctor['id']} FOR {disp}")
        result = Appointment.create(appt_data)
        print("DB RESULT:", result)
        if result:
            # Trigger WhatsApp notification asynchronously
            try:
                send_whatsapp_confirmation(
                    to_phone=phone,
                    details={
                        'patient_name': patient_name,
                        'doctor_name': disp,
                        'date': date_str,
                        'time': time_slot,
                        'reference_number': appt_data['reference_number']
                    }
                )
            except Exception as e:
                print(f"Failed to queue WhatsApp message: {e}")
                
            amount_msg = f"\n• Fee: ₹{appt_data['payment_amount']}" if appt_data.get('payment_amount') else ""
            return f"✅ Appointment successfully booked!\n• Patient ID: {result.get('patient_id')}\n• Doctor: {disp}\n• Date: {date_str}\n• Time: {time_slot}\n• Patient: {patient_name}{amount_msg}\n• Ref: {result.get('reference_number')}\n\nImportant: Your slot is now reserved. Please arrive 15 minutes early."
        return "Booking failed. Please try again."
    except Exception as e:
        print("❌ Booking error:", e)
        return f"Booking error: {e}"

def get_appointment_info(patient_name: str) -> str:
    try:
        appointments = Appointment.get_by_patient_name(patient_name)
        if not appointments:
            return f"No appointments found for **{patient_name}**."
        lines = [f"• Dr. {a.get('doctor_name')} on {a.get('date')} at {a.get('time')}" for a in appointments]
        return f"Appointments for **{patient_name}**:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"

def submit_feedback_record(feedback_type: str, message: str, name: str = "Anonymous") -> str:
    val = feedback_type.lower()
    cat = "Complaint" if "complaint" in val else "Suggestion" if "suggestion" in val else "Compliment"
    try:
        Complaint.create({'patient_name': name, 'category': cat, 'description': message})
        return f"Thank you, {name}! Your {cat.lower()} has been recorded."
    except Exception as e:
        return f"Error: {e}"

def get_hospital_info(topic: str = "general") -> str:
    info = {
        "hours": f"{HOSPITAL_NAME}: Mon-Sat 8AM-8PM. Emergency 24/7.",
        "location": f"{HOSPITAL_NAME} is at 123 Health Nagar, Hyderabad.",
        "emergency": f"Emergency: {HOSPITAL_PHONE}. Ambulance: 108.",
        "departments": "Cardiology, Neurology, Orthopedics, Pediatrics, Oncology, and more.",
        "insurance": "We accept Apollo Munich, Star Health, HDFC Ergo, and other major providers.",
        "facilities": "24/7 Pharmacy, Laboratory, ICU, Blood Bank, Private Rooms.",
        "visitors": "Visiting hours: 4PM-6PM. One visitor per patient.",
        "general": f"Welcome to {HOSPITAL_NAME}! 📍 Hyderabad 📞 {HOSPITAL_PHONE}. Multi-specialty hospital."
    }
    return info.get(topic.lower(), info["general"])

# ─────────────────────────────────────────────
#  TOOL REGISTRY
# ─────────────────────────────────────────────
TOOLS = {
    "list_departments": list_departments,
    "list_hospital_departments": list_departments, # Alias
    "list_doctors": list_doctors,
    "list_all_doctors": list_doctors, # Alias
    "get_doctor_availability": get_doctor_availability,
    "doctor_availability": get_doctor_availability, # Alias
    "book_hospital_appointment": book_hospital_appointment,
    "get_appointment_info": get_appointment_info,
    "submit_feedback_record": submit_feedback_record,
    "get_hospital_info": get_hospital_info,
}

# ─────────────────────────────────────────────
#  AGENTIC SYSTEM PROMPT
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an intelligent hospital assistant for Haveda Hospital.

CRITICAL: You MUST respond in the following language: {language}
If LANGUAGE is not "English", translate ALL your conversational output (including greetings, info, and tool result summaries) to that language.

HINDI RULE: If the language is Hindi, you MUST use Devanagari script (e.g. नमस्ते) and NOT Romanized Hindi/Hinglish.

However, keep JSON tool calls (when you call a tool) in English format as specified.

-----------------------------------
DATABASE ACCESS RULES (STRICT):
1. **NO HALLUCINATION**: You have NO knowledge of hospital staff, doctors, fees, or departments.
2. **MANDATORY TOOL USE**: To answer ANY question about:
   - "Which doctors are available?"
   - "Who is in the [Department]?"
   - "List all specialists."
   - "What departments do you have?"
   - "What time can I book?"
   → You **MUST** call a tool in JSON format.
3. **NEVER** generate a list of names (e.g., Dr. Amit Sharma) by yourself. If you don't call a tool, your answer is INCORRECT.
4. **FORMAT**: If you call a tool, provide ONLY the JSON block. Do not add intro text.

-----------------------------------
INTENTS & TOOLS:
- **list_departments**: Get all available hospital departments.
- **list_doctors**: Get a list of doctors. (Optional: "department" arg)
- **doctor_availability**: Check specific slots for a doctor on a date. ("doctor_name", "date")
- **book_hospital_appointment**: Book a slot. Needs: doctor_name, date, time, patient_name, phone.
- **get_appointment_info**: Check existing bookings for a "patient_name".
- **get_hospital_info**: General info about location, hours, etc. ("topic")

-----------------------------------
CRITICAL RULES:

1. BOOKING PRIORITY:
If user mentions ANY of: book, appointment, schedule
→ ALWAYS prepare for "book_hospital_appointment" flow.

2. DO NOT ASK AGAIN:
If doctor name/date/time/phone is already in the history, DO NOT ask for it again.

3. SYMPTOM → DEPARTMENT:
- heart, chest pain → Cardiology
- brain, headache → Neurology
- bone, joint, fracture → Orthopedics
- child, baby → Pediatrics

4. COMPLETE BOOKING:
ONLY call `book_hospital_appointment` if you have:
- doctor_name
- date (YYYY-MM-DD)
- time (Specific slot like "10:00 AM")
- patient_name
- phone (Valid number)
→ IF ANY are missing: Ask for them specifically.

5. PARTIAL DATA:
If user asks "List Orthopedics doctors", call `list_doctors(department="Orthopedics")`. 
DO NOT list names yourself.

-----------------------------------
OUTPUT FORMAT:

If calling tool:
{{
  "tool": "tool_name",
  "args": {{ ... }}
}}

If asking user for info:
[Friendly concise response]

-----------------------------------
-----------------------------------
TODAY IS: {today}

CRITICAL: The current language is {language}. All user-facing text MUST be in {language}.
"""

class HospitalAgent:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=HF_TOKEN,
        )
        self.model = "meta-llama/Llama-3.1-8B-Instruct"

    def _call_hf(self, messages: List[Dict], max_tokens: int = 2048) -> Optional[str]:
        for attempt in range(3):  # 🔥 retry 3 times
            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.1
                )
                content = completion.choices[0].message.content
                if not content: return ""
                return content.strip()
            except Exception as e:
                print(f"❌ HF ERROR (Attempt {attempt+1}): {e}")
                logger.error(f"[HF Error] {e}")
                time.sleep(1)
        return None

    def _strip_markdown(self, text: str) -> str:
        if not text: return ""
        text = re.sub(r'```(?:json)?\s*(.*?)\s*```', r'\1', text, flags=re.DOTALL | re.IGNORECASE)
        return text.strip()

    def process_query(self, user_text: str, chat_history: List[Dict] = None, language: str = "English") -> str:
        today_str = date.today().isoformat()
        sys_prompt = SYSTEM_PROMPT.format(today=today_str, language=language)
        
        messages = [
            {"role": "system", "content": f"You are a helpful hospital assistant. MANDATORY: Respond in {language}. All conversational text MUST be in {language}."},
            {"role": "system", "content": f"IGNORE the language used in the chat history. Even if the history is in English, you MUST respond in {language} from now on."},
            {"role": "system", "content": sys_prompt}
        ]
        
        if chat_history:
            for msg in chat_history[-5:]:
                role = "assistant" if msg.get("sender") == "bot" else "user"
                content = msg.get("text", msg.get("message", ""))
                if content:
                    messages.append({"role": role, "content": content})
        
        processed_user_text = user_text
        if language != "English":
            processed_user_text = f"(Language: {language}) {user_text}"
            
        messages.append({"role": "user", "content": processed_user_text})
        
        print(f"DEBUG: PROMPT SENT: {messages[0]['content'][:100]}...")
        print(f"DEBUG: FINAL MSG: {messages[-1]['content']}")
        response = self._call_hf(messages)
        print(f"DEBUG: RAW LLM RESPONSE: {response}")
        if not response:
            # 🔥 FALLBACK (NO AI)
            text = user_text.lower()
            if any(w in text for w in ["doctor", "cardiology", "heart"]):
                return list_doctors("Cardiology")
            if any(w in text for w in ["department", "list", "show"]):
                return list_departments()
            return "I'm facing a temporary connection issue. Please try again in 10 seconds or list our departments to see what we offer."

        # 🔥 ROBUST JSON EXTRACTION
        try:
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                json_str = match.group()
                tool_data = json.loads(json_str)
                
                if "tool" in tool_data:
                    tool_name = tool_data.get("tool")
                    args = tool_data.get("args", {})
                    
                    print(f"🔥 TOOL CALL detected: {tool_name}")
                    print(f"🔥 ARGS: {args}")

                    if tool_name in TOOLS:
                        logger.info(f"Executing tool: {tool_name} with args: {args}")
                        tool_result = TOOLS[tool_name](**args)
                        
                        # If not English, ask LLM to translate the tool result
                        if language != "English":
                            print(f"DEBUG: Translating tool result to {language}")
                            messages.append({"role": "assistant", "content": response})
                            messages.append({"role": "system", "content": f"The tool '{tool_name}' returned: {tool_result}. Now, translate this information to {language} and provide a friendly response to the user. DO NOT call any more tools."})
                            translated = self._call_hf(messages)
                            return translated or tool_result
                        
                        return tool_result
                    else:
                        print(f"❌ Unknown tool: {tool_name}")
                        error_msg = f"I'm sorry, I don't know how to use the tool: {tool_name}"
                        if language != "English":
                            messages.append({"role": "system", "content": f"Translate this error to {language}: {error_msg}"})
                            return self._call_hf(messages) or error_msg
                        return error_msg
        except Exception as e:
            print(f"❌ Tool execution error: {e}")
            logger.error(f"Error executing tool: {e}\n{traceback.format_exc()}")
            # If JSON parsing failed, return original text as it might be a normal message
        
        return response

agent = HospitalAgent()
