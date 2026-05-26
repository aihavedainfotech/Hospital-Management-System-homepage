import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaMicrophone, FaPaperPlane, FaTimes, FaVolumeUp, FaVolumeMute, FaStop, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock } from 'react-icons/fa';
import apiClient from '../services/apiClient';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  showPicker?: 'date' | 'time' | 'both';
  pickerContext?: { doctorName?: string; date?: string };
}

const LANGUAGES = [
  { name: 'English', code: 'en-US' },
  { name: 'Hindi', code: 'hi-IN' },
  { name: 'Telugu', code: 'te-IN' },
  { name: 'Tamil', code: 'ta-IN' },
  { name: 'Malayalam', code: 'ml-IN' },
  { name: 'Kannada', code: 'kn-IN' },
  { name: 'Bengali', code: 'bn-IN' },
  { name: 'Gujarati', code: 'gu-IN' },
  { name: 'Marathi', code: 'mr-IN' },
  { name: 'Punjabi', code: 'pa-IN' }
];

function isDayAvailable(availableDays: string, jsDate: Date): boolean {
  const ad = (availableDays || 'Everyday').toLowerCase().trim();
  if (!ad || ['everyday', 'always', '24/7', 'all days'].includes(ad)) return true;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIdx = jsDate.getDay();
  const dayName = days[dayIdx];
  if (ad.includes('-')) {
    const parts = ad.split('-').map(p => p.trim().slice(0, 3));
    if (parts.length === 2) {
      const startIdx = days.indexOf(parts[0]);
      const endIdx = days.indexOf(parts[1]);
      if (startIdx !== -1 && endIdx !== -1) {
        if (startIdx <= endIdx) return dayIdx >= startIdx && dayIdx <= endIdx;
        return dayIdx >= startIdx || dayIdx <= endIdx;
      }
    }
  }
  const list = ad.split(',').map(d => d.trim().slice(0, 3));
  return list.includes(dayName);
}

const MiniCalendar: React.FC<{
  onSelect: (date: string) => void;
  minDate?: string;
  availableDays?: string;
}> = ({ onSelect, minDate, availableDays = 'Everyday' }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const min = minDate ? new Date(minDate) : new Date(today);
  min.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };
  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < min) return true;
    return !isDayAvailable(availableDays, d);
  };
  const handleDay = (day: number) => {
    if (isDisabled(day)) return;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onSelect(`${viewYear}-${m}-${d}`);
  };
  const isDayOfWeekAvailable = (colIdx: number) => {
    let d = new Date(viewYear, viewMonth, 1);
    while (d.getDay() !== colIdx) d.setDate(d.getDate() + 1);
    return isDayAvailable(availableDays, d);
  };

  return (
    <div className="rounded-2xl shadow-lg p-3 w-full mt-2" style={{ background: '#F8FFFE', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,45,82,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition"><FaChevronLeft className="text-slate-500 text-xs" /></button>
        <span className="text-xs font-bold text-slate-700">{monthNames[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition"><FaChevronRight className="text-slate-500 text-xs" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold ${isDayOfWeekAvailable(i) ? 'text-slate-500' : 'text-slate-300'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const disabled = isDisabled(day);
          const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
          return (
            <button key={day} onClick={() => handleDay(day)} disabled={disabled} className={`mx-auto w-7 h-7 rounded-full text-[11px] font-medium flex items-center justify-center transition-all ${disabled ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer text-slate-700'} ${isToday && !disabled ? 'font-bold' : ''}`}
              style={!disabled ? { ...(isToday ? { outline: '2px solid #14B8A6', color: '#14B8A6' } : {}) } : {}}
              onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#14B8A6'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; } }}
              onMouseLeave={e => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = isToday ? '#14B8A6' : '#334155'; } }}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimeSlotPicker: React.FC<{ doctorName?: string; date?: string; onSelect: (time: string) => void; }> = ({ doctorName, date, onSelect }) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!doctorName || !date) {
      setSlots(['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM', '12:00 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM']);
      return;
    }
    setLoading(true);
    apiClient.get(`/homepage/chatbot/slots`, { params: { doctor_name: doctorName, date } })
      .then(res => setSlots(res.data.slots && res.data.slots.length > 0 ? res.data.slots : ['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM']))
      .catch(() => setSlots(['9:00 AM','9:30 AM','10:00 AM','2:00 PM','3:00 PM','4:00 PM']))
      .finally(() => setLoading(false));
  }, [doctorName, date]);

  if (loading) return <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 p-2"><div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full" />Loading slots...</div>;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2" style={{ color: '#14B8A6' }}><FaClock style={{ color: '#14B8A6' }} /> Available time slots</div>
      <div className="grid grid-cols-3 gap-1.5">
        {slots.map(slot => (
          <button key={slot} onClick={() => onSelect(slot)} className="py-1.5 px-2 text-[11px] font-semibold rounded-xl border transition-all"
            style={{ background: '#F8FFFE', color: '#14B8A6', borderColor: '#E2E8F0' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#14B8A6'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#14B8A6'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FFFE'; (e.currentTarget as HTMLButtonElement).style.color = '#14B8A6'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; }}>
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
};

const BookingPicker: React.FC<{ mode: 'date' | 'time' | 'both'; context: { doctorName?: string; date?: string }; onDateSelect: (date: string) => void; onTimeSelect: (time: string) => void; }> = ({ mode, context, onDateSelect, onTimeSelect }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(context.date || null);
  const [availableDays, setAvailableDays] = useState('Everyday');
  const [timings, setTimings] = useState('');
  useEffect(() => {
    if (!context.doctorName) return;
    apiClient.get('/homepage/chatbot/doctor-info', { params: { doctor_name: context.doctorName } })
      .then(res => { if (res.data.available_days) setAvailableDays(res.data.available_days); if (res.data.timings) setTimings(res.data.timings); });
  }, [context.doctorName]);

  return (
    <div className="w-full mt-1">
      {timings && <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><FaClock className="text-blue-400" />Working hours: <span className="font-semibold text-slate-700">{timings}</span></div>}
      {(mode === 'date' || mode === 'both') && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1"><FaCalendarAlt className="text-blue-500" /> Pick a date</div>
          <MiniCalendar onSelect={(d) => { setSelectedDate(d); onDateSelect(d); }} minDate={new Date().toISOString().split('T')[0]} availableDays={availableDays} />
        </div>
      )}
      {(mode === 'time' || (mode === 'both' && selectedDate)) && <TimeSlotPicker doctorName={context.doctorName} date={selectedDate || context.date} onSelect={onTimeSelect} />}
    </div>
  );
};

function detectPickerIntent(botText: string): { show: boolean; mode: 'date' | 'time' | 'both' } {
  const t = botText.toLowerCase();
  const wantsDate = /what date|which date|prefer.*date|pick.*date|choose.*date|select.*date|date.*appointment|appointment.*date|when would|what day|which day/i.test(t);
  const wantsTime = /what time|which time|prefer.*time|pick.*time|choose.*time|select.*time|time.*slot|available slot|slot.*available|what time works/i.test(t);
  if (wantsDate && wantsTime) return { show: true, mode: 'both' };
  if (wantsDate) return { show: true, mode: 'date' };
  if (wantsTime) return { show: true, mode: 'time' };
  return { show: false, mode: 'date' };
}
function extractDoctorName(messages: Message[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].text.match(/(?:dr\.?\s+|doctor\s+)([a-z]+(?:\s+[a-z]+)?)/i);
    if (match) return match[0];
  }
  return undefined;
}
function extractDate(messages: Message[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (match) return match[1];
  }
  return undefined;
}

const QUICK_ACTIONS = [
  { label: '📅 Book Appointment', message: 'I want to book an appointment' },
  { label: '👨‍⚕️ Find a Doctor', message: 'Show me the list of doctors' },
  { label: '🏥 Our Departments', message: 'What departments are available?' },
  { label: '❓ General Enquiry', message: 'I have a general enquiry about the hospital' },
];

const SERVICE_BANNER = "I can help with appointments, doctors, departments, lab tests, billing, and all Haveda Hospital services. Ask me anything!";

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm Haveda AI. How can I assist you today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [quickActionsVisible, setQuickActionsVisible] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
      utterance.lang = selectedLanguage.code;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendTextToBot = async (text: string, currentMessages: Message[]) => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post('/homepage/chatbot/text', { text, history: messages.slice(-10).map(m => ({ sender: m.sender, text: m.text })), language: selectedLanguage.name });
      const responseText = response.data.response;
      const intent = detectPickerIntent(responseText);
      const botMsg: Message = { text: responseText, sender: 'bot', timestamp: new Date(), showPicker: intent.show ? intent.mode : undefined, pickerContext: intent.show ? { doctorName: extractDoctorName(currentMessages), date: extractDate(currentMessages) } : undefined };
      setMessages(prev => [...prev, botMsg]);
      speak(responseText);
    } catch {
      setMessages(prev => [...prev, { text: "I'm facing a connection issue. Please try again.", sender: 'bot', timestamp: new Date() }]);
    } finally { setIsProcessing(false); }
  };

  const handleSendText = () => {
    if (!inputText.trim() || isProcessing) return;
    setQuickActionsVisible(false);
    const userMsg: Message = { text: inputText, sender: 'user', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    sendTextToBot(userMsg.text, updated);
  };

  const handleQuickAction = (message: string) => {
    setQuickActionsVisible(false);
    const userMsg: Message = { text: message, sender: 'user', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    sendTextToBot(message, updated);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.wav');
        formData.append('language', selectedLanguage.code);
        formData.append('history', JSON.stringify(messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }))));
        try {
          const res = await apiClient.post('/homepage/chatbot/voice', formData);
          if (res.data.transcript) {
            const userMsg: Message = { text: `ðŸŽ¤ ${res.data.transcript}`, sender: 'user', timestamp: new Date() };
            setMessages(prev => [...prev, userMsg]);
            sendTextToBot(res.data.transcript, [...messages, userMsg]);
          }
        } catch { setMessages(prev => [...prev, { text: "Couldn't hear that. Try again?", sender: 'bot', timestamp: new Date() }]); }
        finally { setIsProcessing(false); }
      };
      recorder.start();
      setIsRecording(true);
    } catch { alert("Microphone access denied."); }
  };

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      className="fixed bottom-8 right-8 z-[10000] font-sans"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="mb-6 w-80 sm:w-[400px] h-[600px] bg-[#F8FFFE] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E2E8F0]">
            <div className="p-6 text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg"><FaRobot className="text-2xl" /></div>
                  <div>
                    <h3 className="text-xl font-bold">Haveda AI</h3>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span className="text-xs opacity-80 uppercase tracking-widest">Online</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/10 rounded-xl">{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-xl"><FaTimes /></button>
                </div>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FFFE] custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] ${msg.sender === 'user' ? 'bg-[#14B8A6] text-white rounded-tr-none' : 'bg-[#ECFEFF] text-[#0F172A] border border-[#E2E8F0] rounded-tl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                  {msg.sender === 'bot' && msg.showPicker && (
                    <BookingPicker mode={msg.showPicker} context={msg.pickerContext || {}} onDateSelect={(d) => sendTextToBot(`Date: ${d}`, messages)} onTimeSelect={(t) => sendTextToBot(`Time: ${t}`, messages)} />
                  )}
                  {/* Service banner + quick actions after the first bot message */}
                  {msg.sender === 'bot' && i === 0 && quickActionsVisible && (
                    <div className="w-full mt-3">
                      <div className="text-[12px] text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 mb-3 shadow-sm" style={{ lineHeight: 1.5 }}>
                        <span style={{ color: '#14B8A6', fontWeight: 600 }}>💬 </span>{SERVICE_BANNER}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleQuickAction(action.message)}
                            className="text-left px-3 py-2.5 rounded-xl border text-[12px] font-semibold transition-all"
                            style={{ background: '#F8FFFE', borderColor: '#E2E8F0', color: '#0F172A' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#14B8A6'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#14B8A6'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FFFE'; (e.currentTarget as HTMLButtonElement).style.color = '#0F172A'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && <div className="flex gap-1 p-2"><div className="w-2 h-2 bg-[#14B8A6] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#14B8A6] rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-[#14B8A6] rounded-full animate-bounce delay-150"></div></div>}
            </div>
            <div className="p-5 border-t border-[#E2E8F0] bg-white">
              <div className="flex gap-2">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendText()} placeholder="Type a message..." className="flex-1 px-4 py-3 bg-[#F8FFFE] rounded-xl border border-[#E2E8F0] outline-none focus:border-[#14B8A6] transition-all" />
                <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`p-4 rounded-xl ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#F8FFFE] text-[#64748B] border border-[#E2E8F0]'}`}><FaMicrophone /></button>
                <button onClick={handleSendText} className="p-4 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl shadow-lg"><FaPaperPlane /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setIsOpen(!isOpen); if (!isOpen) setQuickActionsVisible(messages.length <= 1); }} className="w-16 h-16 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white cursor-move"><FaRobot className="text-3xl" /></motion.button>
    </motion.div>
  );
};

export default ChatBot;
