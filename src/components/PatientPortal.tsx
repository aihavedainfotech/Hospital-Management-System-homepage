import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import { fetchPatientLabOrders, LabOrder, cancelAppointmentRequest, rescheduleAppointment, fetchSlots, Slot, lockSlot, unlockSlot } from '../api';
import apiClient from '../services/apiClient';

function OTPInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (newOtp.every(d => d)) onComplete(newOtp.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="otp-input-group">
      {otp.map((digit, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric"
          value={digit} onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="otp-input" maxLength={1} />
      ))}
    </div>
  );
}

// ── Inline appointment booking modal used from the portal ────────────────
function PortalBookingModal({ patientId, patientName, patientPhone, patientAge, onClose }: { patientId: string; patientName: string; patientPhone?: string; patientAge?: number | string; onClose: () => void }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dept, setDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorOnLeave, setDoctorOnLeave] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lockToken] = useState(() => Math.random().toString(36).substring(2, 11));
  const timerRef = useRef<any | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    import('../api').then(({ fetchDoctors }) => {
      fetchDoctors().then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setDoctors(data);
      }).catch(() => setDoctors([]));
    });
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      setDoctorOnLeave(false);
      import('../api').then(({ fetchSlots }) => {
        fetchSlots(selectedDoctor.id, selectedDate, lockToken).then((res: any) => {
          const slots = res.data || (Array.isArray(res) ? res : []);
          if (res.on_leave) { setDoctorOnLeave(true); setAvailableSlots([]); }
          else setAvailableSlots(slots);
        }).catch(() => toast.error('Could not load slots')).finally(() => setLoadingSlots(false));
      });
    }
  }, [selectedDoctor, selectedDate, lockToken]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(p => p !== null ? p - 1 : null), 1000);
    } else if (timeLeft === 0) {
      toast.info('Slot selection expired. Please select again.');
      setSelectedSlot('');
      import('../api').then(({ unlockSlot }) => unlockSlot(lockToken).catch(console.error));
      setTimeLeft(null);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, lockToken]);

  const handleSlotSelect = async (time: string, available: boolean) => {
    if (!available || !selectedDoctor || !selectedDate) return;
    const { lockSlot } = await import('../api');
    const res = await lockSlot(selectedDoctor.id, selectedDate, time, lockToken);
    if (res.success) { setSelectedSlot(time); setTimeLeft(420); toast.info('Slot held for 7 minutes! ⏱️'); }
    else toast.error(res.error || 'Could not lock slot');
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) { toast.error('Please select doctor, date and time.'); return; }
    setSubmitting(true);
    try {
      const { bookAppointment } = await import('../api');
      const res = await bookAppointment({
        doctor_id: selectedDoctor.id,
        patient_id: patientId,
        patient_name: patientName,
        patient_phone: patientPhone || '',
        patient_age: patientAge ? parseInt(String(patientAge)) : 0,
        date: selectedDate,
        time: selectedSlot,
        lock_token: lockToken,
        description,
        visit_type: 'Consultation',
      });
      if (res.reference) {
        setRefNumber(res.reference);
        setConfirmed(true);
        toast.success('Appointment booked! 🎉');
        setTimeLeft(null);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const departments = ['', ...new Set(doctors.map((d: any) => d.department).filter(Boolean))];
  const filteredDoctors = dept ? doctors.filter((d: any) => d.department === dept) : doctors;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', padding: '1.5rem' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              <i className="fas fa-calendar-plus" style={{ color: 'var(--teal)', marginRight: '0.5rem' }}></i>Book Appointment
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>For: <strong>{patientName}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #52c41a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'white', fontSize: '2rem' }}>
              <i className="fas fa-check"></i>
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, marginBottom: '0.5rem' }}>Appointment Confirmed!</h3>
            <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '1rem', margin: '1rem 0', textAlign: 'left', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><span style={{ color: 'var(--text-muted)' }}>Patient:</span><strong>{patientName}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><span style={{ color: 'var(--text-muted)' }}>Doctor:</span><strong>{selectedDoctor?.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><span style={{ color: 'var(--text-muted)' }}>Date:</span><strong>{selectedDate}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Time:</span><strong>{selectedSlot}</strong></div>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal)', marginBottom: '1.25rem' }}>{refNumber}</div>
            <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Done</button>
          </div>
        ) : (
          <div>
            {/* Department */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label><i className="fas fa-hospital" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Department</label>
              <select value={dept} onChange={e => { setDept(e.target.value); setSelectedDoctor(null); }}>
                <option value="">-- All Departments --</option>
                {departments.filter(Boolean).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            {/* Doctor list */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                <i className="fas fa-user-md" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Select Doctor
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                {filteredDoctors.filter((d: any) => d.is_active !== false).map((doc: any) => (
                  <div key={doc.id} onClick={() => { setSelectedDoctor(doc); setSelectedDate(''); setSelectedSlot(''); }}
                    style={{ border: `2px solid ${selectedDoctor?.id === doc.id ? 'var(--teal)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', background: selectedDoctor?.id === doc.id ? 'rgba(61,140,140,0.06)' : 'var(--bg-primary)', transition: 'all 0.15s' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy), var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{doc.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>{doc.specialization}</div>
                    </div>
                    {selectedDoctor?.id === doc.id && <i className="fas fa-check-circle" style={{ color: 'var(--teal)' }}></i>}
                  </div>
                ))}
              </div>
            </div>
            {/* Calendar */}
            {selectedDoctor && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}><i className="fas fa-chevron-left"></i></button>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}><i className="fas fa-chevron-right"></i></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.2rem 0' }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`}></div>)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const dateObj = new Date(year, month, d);
                    const isPast = dateObj < today;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    return (
                      <div key={d} onClick={() => !isPast && (setSelectedDate(dateStr), setSelectedSlot(''))}
                        className={`cal-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}>{d}</div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Slots */}
            {selectedDate && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  <i className="fas fa-clock" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Available Slots
                  {timeLeft !== null && <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#e74c3c', fontWeight: 700 }}>⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>}
                </label>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>
                ) : doctorOnLeave ? (
                  <div style={{ padding: '0.875rem', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', color: '#DC2626', fontSize: '0.85rem' }}>
                    <i className="fas fa-calendar-times" style={{ marginRight: '0.4rem' }}></i>Doctor is on leave on this date. Please select another date.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No slots available.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availableSlots.map((slot: any) => {
                      const isBooked = slot.status === 'booked';
                      const isLocked = slot.status === 'locked' && !slot.is_mine;
                      const isPast = slot.status === 'past';
                      const disabled = isBooked || isLocked || isPast;
                      return (
                        <button key={slot.time} disabled={disabled}
                          onClick={() => handleSlotSelect(slot.time, !disabled)}
                          className={`time-slot ${selectedSlot === slot.time ? 'selected' : ''} ${disabled ? 'unavailable' : ''}`}
                          style={{ ...(isBooked ? { opacity: 0.6, background: '#ffebee' } : {}), ...(isLocked ? { opacity: 0.6, background: '#fff3e0' } : {}) }}>
                          {slot.time}
                          {isBooked && <div style={{ fontSize: '0.55rem', color: '#e74c3c' }}>Booked</div>}
                          {isLocked && <div style={{ fontSize: '0.55rem', color: '#e67e22' }}>Locked</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Reason */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label><i className="fas fa-sticky-note" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Reason / Symptoms (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the health concern briefly..." rows={2} style={{ resize: 'vertical' }}></textarea>
            </div>
            <button className="btn-primary" onClick={handleBook} disabled={submitting || !selectedDoctor || !selectedDate || !selectedSlot}
              style={{ width: '100%', justifyContent: 'center', opacity: (!selectedDoctor || !selectedDate || !selectedSlot) ? 0.5 : 1 }}>
              {submitting ? <><i className="fas fa-spinner fa-spin"></i> Booking...</> : <><i className="fas fa-check-circle"></i> Confirm Appointment</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientPortal({ onClose }: { onClose: () => void }) {
  const { patient, setPatient, logout } = useApp();
  // ── login state ──────────────────────────────────────────────────────────
  const [loginType, setLoginType] = useState<'phone' | 'patient_id'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [phoneMasked, setPhoneMasked] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [resolvedPatientId, setResolvedPatientId] = useState('');
  // ── multi-patient selection (phone login) ────────────────────────────────
  const [phonePatients, setPhonePatients] = useState<any[]>([]);
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  // ── family records state ─────────────────────────────────────────────────
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [familyOtpTarget, setFamilyOtpTarget] = useState<any | null>(null);
  const [familyOtpSent, setFamilyOtpSent] = useState(false);
  const [familySending, setFamilySending] = useState(false);
  const [familyOtpMasked, setFamilyOtpMasked] = useState('');
  const [familyWhatsappSent, setFamilyWhatsappSent] = useState(false);
  const [viewingMember, setViewingMember] = useState<any | null>(null);
  const [memberRecords, setMemberRecords] = useState<{ appointments: any[]; reports: any[]; prescriptions: any[]; labOrders: any[] } | null>(null);
  const [loadingMemberRecords, setLoadingMemberRecords] = useState(false);
  // ── book appointment from portal ─────────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForPatientId, setBookingForPatientId] = useState<string>('');
  const [bookingForName, setBookingForName] = useState<string>('');
  const [bookingForPhone, setBookingForPhone] = useState<string>('');
  const [bookingForAge, setBookingForAge] = useState<string | number>('');
  // ── portal state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [patientName, setPatientName] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lockToken] = useState(() => Math.random().toString(36).substring(2, 11));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const timerRef = useRef<any | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt' },
    { id: 'appointments', label: 'Appointments', icon: 'fas fa-calendar-check' },
    { id: 'lab_orders', label: 'Lab Orders', icon: 'fas fa-flask' },
    { id: 'reports', label: 'My Reports', icon: 'fas fa-file-medical' },
    { id: 'prescriptions', label: 'Prescriptions', icon: 'fas fa-prescription-bottle-alt' },
    { id: 'family', label: 'Family Records', icon: 'fas fa-users' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
  ];

  // ── Step 1: request OTP ──────────────────────────────────────────────────
  const sendOTP = async () => {
    const val = identifier.trim();
    if (!val) {
      toast.error(loginType === 'phone' ? 'Enter your mobile number' : 'Enter your Patient ID');
      return;
    }
    if (loginType === 'phone' && !/^\d{10}$/.test(val)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setSending(true);
    try {
      const response = await apiClient.post('/homepage/patients/login', {
        login_type: loginType,
        identifier: val,
      });
      const data = response.data;
      if (data.success) {
        setPatientName(data.name);
        setResolvedPatientId(data.patient_id);
        setPhoneMasked(data.phone_masked || '');
        setWhatsappSent(data.whatsapp_sent ?? false);
        setOtpSent(true);
        // Store phone for family lookup later
        if (loginType === 'phone') setLoginPhone(val);
        if (data.whatsapp_sent) {
          toast.success(`OTP sent to WhatsApp (${data.phone_masked}) 📲`);
        } else {
          toast.info('OTP ready — use 123456 for demo (WhatsApp token needs refresh).');
        }
      } else {
        toast.error(data.error || 'Patient not found.');
      }
    } catch {
      toast.error('Failed to connect to server.');
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  const verifyOTP = async (otp: string) => {
    try {
      const response = await apiClient.post('/homepage/patients/verify-otp', {
        identifier: identifier.trim(),
        otp,
      });
      const data = response.data;
      if (data.success) {
        setOtpVerified(true);
        setPatient({
          patient_id: data.patient_id,
          name: data.name,
          age: data.age,
          blood_group: data.blood_group,
          phone: data.phone,
        });
        toast.success('Login successful! Welcome back. 🏥');

        // If logged in by phone, fetch all patients on that number
        const phone = loginType === 'phone' ? identifier.trim() : data.phone;
        if (phone) {
          // Always store the resolved phone for family lookup
          if (!loginPhone) setLoginPhone(phone);
          try {
            const res = await apiClient.get(`/homepage/patients/by-phone/${phone}`);
            if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 1) {
              setPhonePatients(res.data.data);
              setShowPatientSelect(true);
            }
          } catch {
            // non-critical — just skip multi-patient selection
          }
        }
      } else {
        toast.error(data.error || 'Invalid OTP. Please try again.');
      }
    } catch {
      toast.error('Failed to verify OTP.');
    }
  };

  const cleanDate = (d: string) => {
    if (!d) return "";
    if (d.includes('T')) return d.split('T')[0];
    if (d.includes(',') || d.includes(' ')) {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    }
    return d;
  };

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'released') return '#27ae60';
    if (s === 'upcoming' || s === 'booked') return '#3d8c8c';
    if (s === 'cancelled') return '#e74c3c';
    return '#6c757d';
  };

  const isLoggedIn = !!(patient || otpVerified);

  // ── Family records helpers ────────────────────────────────────────────────
  const loadFamilyMembers = async () => {
    // Always use loginPhone (the phone entered at login) as source of truth.
    // patient?.phone may be null/different; loginPhone is always the shared family phone.
    const phone = loginPhone || patient?.phone;
    if (!phone) return;
    // The currently active patient ID — could be from patient context or resolvedPatientId
    const currentId = patient?.patient_id || resolvedPatientId;
    setLoadingFamily(true);
    try {
      const res = await apiClient.get(`/homepage/patients/by-phone/${phone}`);
      if (res.data?.success) {
        // Show ALL other patients on this phone number, excluding only the currently logged-in one
        const others = (res.data.data || []).filter((m: any) => m.id !== currentId);
        setFamilyMembers(others);
      }
    } catch {
      toast.error('Failed to load family records');
    } finally {
      setLoadingFamily(false);
    }
  };

  const sendFamilyOTP = async (member: any) => {
    setFamilyOtpTarget(member);
    setFamilySending(true);
    try {
      const response = await apiClient.post('/homepage/patients/login', {
        login_type: 'patient_id',
        identifier: member.id,
      });
      const data = response.data;
      if (data.success) {
        setFamilyOtpSent(true);
        setFamilyOtpMasked(data.phone_masked || '');
        setFamilyWhatsappSent(data.whatsapp_sent ?? false);
        if (data.whatsapp_sent) {
          toast.success(`OTP sent to WhatsApp (${data.phone_masked}) 📲`);
        } else {
          toast.info('OTP ready — use 123456 for demo.');
        }
      } else {
        toast.error(data.error || 'Failed to send OTP');
        setFamilyOtpTarget(null);
      }
    } catch {
      toast.error('Failed to send OTP');
      setFamilyOtpTarget(null);
    } finally {
      setFamilySending(false);
    }
  };

  const verifyFamilyOTP = async (otp: string) => {
    if (!familyOtpTarget) return;
    try {
      const response = await apiClient.post('/homepage/patients/verify-otp', {
        identifier: familyOtpTarget.id,
        otp,
      });
      const data = response.data;
      if (data.success) {
        toast.success(`Viewing records for ${familyOtpTarget.full_name} 👤`);
        setViewingMember(familyOtpTarget);
        setFamilyOtpSent(false);
        setFamilyOtpTarget(null);
        // Fetch member records
        setLoadingMemberRecords(true);
        try {
          const pId = familyOtpTarget.id;
          const [reportsRes, apptsRes, rxRes] = await Promise.all([
            apiClient.get(`/homepage/patients/${pId}/reports`),
            apiClient.get(`/homepage/patients/${pId}/appointments`),
            apiClient.get(`/homepage/patients/${pId}/prescriptions`),
          ]);
          const { fetchPatientLabOrders: fetchLab } = await import('../api');
          const labRes = await fetchLab(pId);
          setMemberRecords({
            appointments: Array.isArray(apptsRes.data) ? apptsRes.data : (apptsRes.data?.data || []),
            reports: (reportsRes.data || []).map((r: any) => ({ ...r, file_url: `/api/homepage/patients/reports/${r.id}/download` })),
            prescriptions: rxRes.data || [],
            labOrders: labRes || [],
          });
        } catch {
          toast.error('Failed to load member records');
        } finally {
          setLoadingMemberRecords(false);
        }
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Failed to verify OTP');
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'family' && !loadingFamily) {
      // Reload whenever the tab is opened or the active patient changes
      loadFamilyMembers();
    }
  }, [isLoggedIn, activeTab, patient?.patient_id, resolvedPatientId]);

  useEffect(() => {
    if (reschedulingId && newDate) {
      const apt = appointments.find(a => a.id === reschedulingId);
      if (apt && apt.doctor_id) {
        const loadSlots = async () => {
          setLoadingSlots(true);
          try {
            const slots = await fetchSlots(apt.doctor_id, newDate, lockToken);
            setAvailableSlots(Array.isArray(slots) ? slots : []);
          } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to load available slots');
            setAvailableSlots([]);
          } finally {
            setLoadingSlots(false);
          }
        };
        loadSlots();
      } else if (apt && !apt.doctor_id) {
        console.warn('No doctor_id on appointment:', apt);
        setAvailableSlots([]);
      }
    } else {
      setAvailableSlots([]);
    }
  }, [reschedulingId, newDate, appointments, lockToken]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      toast.info('Slot selection expired. Please select again.');
      setNewTime('');
      unlockSlot(lockToken).catch(console.error);
      setTimeLeft(null);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, lockToken]);

  const handleSlotSelect = async (doctorId: string, date: string, time: string) => {
    try {
      const res = await lockSlot(doctorId, date, time, lockToken);
      if (res.success) {
        setNewTime(time);
        setTimeLeft(420); // 7 minutes
        toast.info(`Slot held for 7 minutes! ⏱️`);
      } else {
        toast.error(res.error || 'Could not lock slot');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error locking slot');
    }
  };

  useEffect(() => {
    if (isLoggedIn && (patient?.patient_id || resolvedPatientId)) {
      const fetchPatientData = async () => {
        const pId = patient?.patient_id || resolvedPatientId;
        if (!pId) return;

        // Reset states before fetching new patient data
        setReports([]);
        setAppointments([]);
        setPrescriptions([]);
        setLabOrders([]);
        setLoadingRecords(true);

        try {
          const [reportsRes, apptsRes, rxRes] = await Promise.all([
            apiClient.get(`/homepage/patients/${pId}/reports`),
            apiClient.get(`/homepage/patients/${pId}/appointments`),
            apiClient.get(`/homepage/patients/${pId}/prescriptions`)
          ]);
          const labOrders = await fetchPatientLabOrders(pId);

          setReports((reportsRes.data || []).map((r: any) => ({
            ...r,
            file_url: `/api/homepage/patients/reports/${r.id}/download`
          })));
          
          // Handle appointments data - could be nested in .data or direct array
          const appointmentsData = Array.isArray(apptsRes.data) ? apptsRes.data : (apptsRes.data?.data || []);
          console.log('Fetched appointments:', appointmentsData.length, appointmentsData);
          
          // Remove duplicates by ID (keep the one with refund_status if it exists)
          const uniqueAppointments = appointmentsData.reduce((acc: any[], curr: any) => {
            const existingIndex = acc.findIndex((a: any) => a.id === curr.id);
            if (existingIndex === -1) {
              acc.push(curr);
            } else {
              // If duplicate found, keep the one with refund_status (from cancelled table)
              if (curr.refund_status && !acc[existingIndex].refund_status) {
                acc[existingIndex] = curr;
              }
            }
            return acc;
          }, []);
          
          console.log('After deduplication:', uniqueAppointments.length, uniqueAppointments);
          setAppointments(uniqueAppointments);
          
          setPrescriptions(rxRes.data || []);
          setLabOrders(labOrders || []);
        } catch (error) {
          console.error('Error fetching patient data:', error);
          toast.error('Failed to load patient records');
        } finally {
          setLoadingRecords(false);
        }
      };
      fetchPatientData();
    }
  }, [isLoggedIn, patient?.patient_id, resolvedPatientId]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '20px', width: '100%', maxWidth: isLoggedIn ? '900px' : '420px', maxHeight: '90vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--navy), #2a4a7a)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-h" style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>H</div>
            <div>
              <div style={{ color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem' }}>Patient Portal</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Haveda Hospital</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isLoggedIn && (
              <button onClick={() => { logout(); setOtpVerified(false); setOtpSent(false); setIdentifier(''); setShowPatientSelect(false); setPhonePatients([]); toast.success('Logged out successfully.'); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '0.4rem 0.875rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: '0.3rem' }}></i>Logout
              </button>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* ── Patient selection screen (phone login with multiple patients) ── */}
        {isLoggedIn && showPatientSelect && (
          <div style={{ padding: '2rem', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(61,140,140,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                <i className="fas fa-users" style={{ fontSize: '1.5rem', color: 'var(--teal)' }}></i>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Select Your Profile</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Multiple patients are registered under this number. Choose who you are.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {phonePatients.map((pt: any) => (
                <div key={pt.id}
                  onClick={() => {
                    setPatient({ patient_id: pt.id, name: pt.full_name, age: pt.age, blood_group: pt.blood_group, phone: pt.phone });
                    setResolvedPatientId(pt.id);
                    setShowPatientSelect(false);
                    toast.success(`Welcome, ${pt.full_name}! 🏥`);
                  }}
                  style={{ background: 'var(--bg-primary)', border: '2px solid var(--border-color)', borderRadius: '14px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--teal)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'}>
                  <div style={{ width: '44px', height: '44px', background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(pt.full_name || 'P').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{pt.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {pt.age ? `${pt.age} yrs` : ''}{pt.age && pt.gender ? ' · ' : ''}{pt.gender || ''}
                      {pt.blood_group ? ` · ${pt.blood_group}` : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: '0.1rem' }}>ID: {pt.id}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {!isLoggedIn ? (
          <div style={{ padding: '2rem', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '70px', height: '70px', background: 'rgba(61,140,140,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <i className="fas fa-user-shield" style={{ fontSize: '1.8rem', color: 'var(--teal)' }}></i>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Access your health records securely via WhatsApp OTP.</p>
            </div>

            {!otpSent ? (
              <div>
                {/* Toggle: Phone / Patient ID */}
                <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '12px', padding: '4px', marginBottom: '1.25rem', border: '1.5px solid var(--border-color)' }}>
                  {(['phone', 'patient_id'] as const).map(type => (
                    <button key={type} onClick={() => { setLoginType(type); setIdentifier(''); }}
                      style={{
                        flex: 1, padding: '0.6rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                        background: loginType === type ? 'var(--teal)' : 'transparent',
                        color: loginType === type ? 'white' : 'var(--text-muted)',
                      }}>
                      <i className={`fas ${type === 'phone' ? 'fa-mobile-alt' : 'fa-id-card'}`} style={{ marginRight: '0.4rem' }}></i>
                      {type === 'phone' ? 'Mobile Number' : 'Patient ID'}
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                    <i className={`fas ${loginType === 'phone' ? 'fa-mobile-alt' : 'fa-id-card'}`} style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>
                    {loginType === 'phone' ? 'Mobile Number' : 'Patient ID'}
                  </label>
                  <input
                    type={loginType === 'phone' ? 'tel' : 'text'}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOTP()}
                    placeholder={loginType === 'phone' ? 'e.g. 9876543210' : 'e.g. P00001'}
                    maxLength={loginType === 'phone' ? 10 : 20}
                    style={{ padding: '0.875rem 1rem', border: '1.5px solid var(--border-color)', borderRadius: '12px', fontSize: '1rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '0.3rem' }}></i>
                    {loginType === 'phone'
                      ? 'OTP will be sent to this number via WhatsApp'
                      : 'OTP will be sent to the phone number linked to your Patient ID'}
                  </p>
                </div>

                <button className="btn-primary" onClick={sendOTP} disabled={sending}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}>
                  {sending
                    ? <><i className="fas fa-spinner fa-spin"></i> Sending OTP...</>
                    : <><i className="fab fa-whatsapp"></i> Send OTP via WhatsApp</>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  <i className="fas fa-lock" style={{ marginRight: '0.3rem' }}></i>
                  Secure 6-digit OTP · Valid for 10 minutes
                </p>
              </div>
            ) : (
              <div>
                {/* OTP sent confirmation banner */}
                <div style={{ background: whatsappSent ? 'rgba(37,211,102,0.08)' : 'rgba(61,140,140,0.08)', border: `1px solid ${whatsappSent ? '#25D366' : 'var(--teal)'}`, borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fab fa-whatsapp" style={{ fontSize: '1.5rem', color: '#25D366', flexShrink: 0 }}></i>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {whatsappSent ? 'OTP sent via WhatsApp ✓' : 'OTP ready (demo mode)'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {phoneMasked ? `Sent to: ${phoneMasked}` : `For: ${identifier}`}
                      {!whatsappSent && <span style={{ color: 'var(--teal)', fontWeight: 600 }}> · Use 123456</span>}
                    </div>
                  </div>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Enter the 6-digit OTP for <strong>{patientName}</strong>
                </p>
                <OTPInput onComplete={verifyOTP} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.875rem' }}>
                  <button onClick={() => { setOtpSent(false); setIdentifier(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i>Change
                  </button>
                  <button onClick={sendOTP} disabled={sending}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <i className="fas fa-redo" style={{ marginRight: '0.3rem' }}></i>Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : !showPatientSelect ? (
          <div className="portal-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar */}
            <div className="portal-sidebar" style={{ width: '200px', flexShrink: 0, overflowY: 'auto' }}>
              <div className="portal-sidebar-inner" style={{ padding: '1rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(61,140,140,0.08)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                    {(patient?.name || 'P').charAt(0)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient?.name || 'Patient'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {patient?.patient_id}</div>
                  </div>
                </div>
                {tabs.map(tab => (
                  <div key={tab.id} className={`portal-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}>
                    <i className={tab.icon}></i>
                    <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="portal-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', position: 'relative' }}>
              {loadingRecords && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--teal)' }}></i>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Fetching records...</div>
                </div>
              )}
              {/* Overview */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard Overview</h3>
                    <button
                      onClick={() => { setBookingForPatientId(patient?.patient_id || resolvedPatientId); setBookingForName(patient?.name || ''); setBookingForPhone(patient?.phone || ''); setBookingForAge(patient?.age || ''); setShowBooking(true); }}
                      style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.5rem 1.1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <i className="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { 
                        icon: 'fas fa-calendar-check', 
                        label: 'Total Visits', 
                        value: appointments.filter((a: any) => a.status?.toLowerCase() === 'completed').length.toString(), 
                        color: 'var(--teal)' 
                      },
                      { 
                        icon: 'fas fa-clock', 
                        label: 'Last Visit', 
                        value: (() => {
                          const completed = appointments
                            .filter((a: any) => a.status?.toLowerCase() === 'completed')
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                          return completed[0]?.date || 'N/A';
                        })(), 
                        color: 'var(--gold)' 
                      },
                      { 
                        icon: 'fas fa-calendar-plus', 
                        label: 'Next Appointment', 
                        value: (() => {
                          const upcoming = appointments
                            .filter((a: any) => {
                              const status = a.status?.toLowerCase();
                              return status === 'upcoming' || status === 'booked' || status === 'pending';
                            })
                            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          return upcoming[0]?.date || 'N/A';
                        })(), 
                        color: '#3498db' 
                      },
                      { 
                        icon: 'fas fa-prescription', 
                        label: 'Active Rx', 
                        value: prescriptions.filter((p: any) => p.status?.toLowerCase() === 'pending').length.toString(), 
                        color: '#9b59b6' 
                      },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <i className={stat.icon} style={{ fontSize: '1.5rem', color: stat.color, display: 'block', marginBottom: '0.5rem' }}></i>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.95rem' }}>Recent Activity</h4>
                    {appointments.slice(0, 3).map((a, idx) => (
                      <div key={`${a.id}_${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.doctor_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '10px', background: `${statusColor(a.status)}18`, color: statusColor(a.status) }}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {activeTab === 'appointments' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      My Appointments
                      <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        ({appointments.length} total)
                      </span>
                    </h3>
                    <button
                      onClick={() => { setBookingForPatientId(patient?.patient_id || resolvedPatientId); setBookingForName(patient?.name || ''); setBookingForPhone(patient?.phone || ''); setBookingForAge(patient?.age || ''); setShowBooking(true); }}
                      style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.5rem 1.1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <i className="fas fa-calendar-plus"></i> Book New
                    </button>
                  </div>
                  {loadingRecords ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                      <div>Loading appointments...</div>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Appointments Found</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You haven't booked any appointments yet.</div>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {appointments.map((a, idx) => (
                      <div key={`${a.id}_${idx}`} style={{ marginBottom: '0.875rem' }}>
                        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '42px', height: '42px', background: `${statusColor(a.status)}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="fas fa-user-md" style={{ color: statusColor(a.status) }}></i>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.doctor_name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {a.department} • {a.date} at {a.time}
                                {a.payment_status && (
                                  <span style={{ 
                                    marginLeft: '0.5rem', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 600, 
                                    color: a.payment_status.toLowerCase() === 'paid' ? '#27ae60' : '#e67e22',
                                    background: a.payment_status.toLowerCase() === 'paid' ? 'rgba(39,174,96,0.1)' : 'rgba(230,126,34,0.1)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '8px'
                                  }}>
                                    <i className={`fas ${a.payment_status.toLowerCase() === 'paid' ? 'fa-check-circle' : 'fa-clock'}`} style={{ marginRight: '0.2rem' }}></i>
                                    {a.payment_status}
                                  </span>
                                )}
                                {a.status?.toLowerCase() === 'cancelled' && a.refund_status && (
                                  <span style={{ 
                                    marginLeft: '0.5rem', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 600, 
                                    color: a.refund_status.toLowerCase() === 'pending' ? '#e67e22' : a.refund_status.toLowerCase() === 'processed' ? '#27ae60' : '#6c757d',
                                    background: a.refund_status.toLowerCase() === 'pending' ? 'rgba(230,126,34,0.1)' : a.refund_status.toLowerCase() === 'processed' ? 'rgba(39,174,96,0.1)' : 'rgba(108,117,125,0.1)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '8px'
                                  }}>
                                    <i className={`fas ${a.refund_status.toLowerCase() === 'pending' ? 'fa-hourglass-half' : a.refund_status.toLowerCase() === 'processed' ? 'fa-check-double' : 'fa-info-circle'}`} style={{ marginRight: '0.2rem' }}></i>
                                    Refund: {a.refund_status}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Ref: {a.reference || a.reference_number}
                                {a.status?.toLowerCase() === 'cancelled' && a.cancellation_reason && (
                                  <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>
                                    • Reason: {a.cancellation_reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px', background: `${statusColor(a.status)}18`, color: statusColor(a.status) }}>
                              {a.status}
                            </span>
                            {(a.status.toLowerCase() !== 'cancelled' && a.status.toLowerCase() !== 'completed' && 
                              (a.status.toLowerCase() === 'pending' || a.status.toLowerCase() === 'booked' || a.status.toLowerCase() === 'upcoming')) && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => { setCancellingId(a.id); setCancelReason(''); setReschedulingId(null); }}
                                  style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                 <button onClick={() => { setReschedulingId(a.id); setCancellingId(null); setNewDate(cleanDate(a.date)); setNewTime(a.time); }}
                                   style={{ background: 'none', border: '1px solid var(--teal)', color: 'var(--teal)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Reschedule</button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cancellation Reason Input */}
                        {cancellingId === a.id && (
                          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '1rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            {a.payment_status?.toLowerCase() === 'paid' && (
                              <div style={{ background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', borderRadius: '6px', padding: '0.6rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#d68910' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '0.3rem' }}></i>
                                <strong>Payment Refund:</strong> This appointment has been paid. A refund request will be initiated and processed within 5-7 business days.
                              </div>
                            )}
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#c53030', marginBottom: '0.5rem' }}>Reason for cancellation:</label>
                            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Schedule conflict, feeling better..."
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #feb2b2', fontSize: '0.85rem', marginBottom: '0.75rem', height: '60px' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => setCancellingId(null)} style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', background: '#edf2f7', border: 'none', cursor: 'pointer' }}>Back</button>
                              <button onClick={async () => {
                                if (!cancelReason.trim()) return toast.error('Please provide a reason');
                                try {
                                  const res = await cancelAppointmentRequest(a.id, cancelReason);
                                  if (res.success) {
                                    toast.success('Your appointment has been successfully cancelled! 🏥 We\'ve updated your records.');
                                    setAppointments(prev => prev.filter(apt => apt.id !== a.id));
                                    setCancellingId(null);
                                  } else {
                                    toast.error(res.error || 'Failed to cancel');
                                  }
                                } catch (e) { toast.error('Error processing cancellation'); }
                              }} style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', background: '#f56565', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirm Cancellation</button>
                            </div>
                          </div>
                        )}

                        {/* Reschedule UI */}
                        {reschedulingId === a.id && (
                          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginTop: '-0.5rem', marginBottom: '1rem', position: 'relative' }}>
                            {timeLeft !== null && (
                              <div style={{ 
                                position: 'fixed', 
                                top: '20px', 
                                left: '20px', 
                                background: '#e74c3c', 
                                color: 'white', 
                                padding: '0.6rem 1.25rem', 
                                borderRadius: '50px', 
                                fontSize: '0.9rem', 
                                fontWeight: 700, 
                                zIndex: 9999, 
                                boxShadow: '0 4px 15px rgba(231,76,60,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
                              }}>
                                <i className="fas fa-stopwatch fa-spin" style={{ animationDuration: '2s' }}></i>
                                <span>Slot reserved: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                              </div>
                            )}
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>Select New Date & Time:</label>
                            <div style={{ marginBottom: '1rem' }}>
                              <input type="date" value={newDate} onChange={e => { setNewDate(e.target.value); setNewTime(''); setTimeLeft(null); unlockSlot(lockToken); }} 
                                min={new Date().toISOString().split('T')[0]}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '0.75rem' }} />
                              
                              {loadingSlots ? (
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                  <i className="fas fa-spinner fa-spin" style={{ color: 'var(--teal)' }}></i> Loading slots...
                                </div>
                              ) : availableSlots.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                                  {availableSlots.map((slot, idx) => (
                                    <button key={idx} 
                                      onClick={() => handleSlotSelect(a.doctor_id, newDate, slot.time)}
                                      disabled={!slot.available && slot.status !== 'available'}
                                      style={{ 
                                        padding: '0.5rem', 
                                        borderRadius: '6px', 
                                        border: newTime === slot.time ? '2px solid var(--teal)' : '1px solid #bae6fd',
                                        background: newTime === slot.time ? 'rgba(61,140,140,0.1)' : 
                                                    slot.status === 'booked' ? '#ffebee' : 
                                                    slot.status === 'locked' ? '#fff3e0' : 'white',
                                        color: slot.status === 'booked' ? '#c62828' : 
                                               slot.status === 'locked' ? '#ef6c00' : 
                                               slot.available ? 'var(--text-primary)' : '#ccc',
                                        cursor: (slot.available || slot.status === 'available') ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem',
                                        fontWeight: newTime === slot.time ? 700 : 500,
                                        position: 'relative'
                                      }}>
                                      {slot.time}
                                      {slot.status === 'booked' && <div style={{fontSize: '0.6rem', opacity: 0.8}}>Booked</div>}
                                      {slot.status === 'locked' && !slot.is_mine && <div style={{fontSize: '0.6rem', opacity: 0.8}}>Locked</div>}
                                    </button>
                                  ))}
                                </div>
                              ) : newDate ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#e74c3c', fontSize: '0.85rem' }}>
                                  No slots available for this date.
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  Please select a date to see available slots.
                                </div>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => { setReschedulingId(null); setTimeLeft(null); unlockSlot(lockToken); }} style={{ padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', background: '#edf2f7', border: 'none', cursor: 'pointer' }}>Back</button>
                              <button disabled={!newDate || !newTime} onClick={async () => {
                                 try {
                                  const res = await rescheduleAppointment(a.id, newDate, newTime, lockToken);
                                  if (res.success) {
                                    toast.success('Appointment rescheduled successfully! 📅 We\'ve updated your slot.');
                                    setAppointments(prev => prev.map(apt => apt.id === a.id ? { ...apt, date: newDate, time: newTime } : apt));
                                    setReschedulingId(null);
                                    setTimeLeft(null);
                                    unlockSlot(lockToken);
                                  } else {
                                    toast.error(res.error || 'Failed to reschedule');
                                  }
                                } catch (e) { toast.error('Error processing reschedule'); }
                              }} style={{ padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--teal)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: (!newDate || !newTime) ? 0.6 : 1 }}>
                                Confirm Reschedule
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {/* Lab Orders */}
              {activeTab === 'lab_orders' && (
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Lab Orders</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {labOrders.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No lab orders found.</p>
                    ) : (
                      labOrders.map(lo => (
                        <div key={lo.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '42px', height: '42px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="fas fa-microscope" style={{ color: '#3498db', fontSize: '1.1rem' }}></i>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{lo.test_name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lo.doctor_name} • {lo.order_date}</div>
                              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{lo.department || 'Laboratory'}</span>
                                {lo.payment_status && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: lo.payment_status.toLowerCase() === 'paid' ? '#27ae60' : '#e67e22' }}>
                                    <i className={`fas ${lo.payment_status.toLowerCase() === 'paid' ? 'fa-check-circle' : 'fa-clock'}`} style={{ marginRight: '0.2rem' }}></i>
                                    {lo.payment_status}
                                  </span>
                                )}
                                {lo.amount && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>₹{lo.amount}</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '10px', background: lo.status === 'Completed' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(241, 196, 15, 0.1)', color: lo.status === 'Completed' ? '#27ae60' : '#f1c40f', marginBottom: '0.5rem', display: 'inline-block' }}>{lo.status}</span>
                            {lo.result && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Result: {lo.result}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Reports */}
              {activeTab === 'reports' && (
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Medical Reports</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {reports.map((r: any) => (
                      <div key={r.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div style={{ width: '42px', height: '42px', background: 'rgba(61,140,140,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fas fa-file-medical" style={{ color: 'var(--teal)', fontSize: '1.1rem' }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.doctor_name} • {r.date}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(61,140,140,0.1)', color: 'var(--teal)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{r.type}</span>
                              {r.lab_order_id && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Order ID: {r.lab_order_id}</span>}
                            </div>
                          </div>
                        </div>
                        {r.file_url ? (
                          <a href={r.file_url} download style={{ textDecoration: 'none' }}>
                            <button style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.4rem 0.875rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <i className="fas fa-download"></i>Download
                            </button>
                          </a>
                        ) : (
                          <button style={{ background: 'var(--border-color)', border: 'none', color: 'var(--text-muted)', padding: '0.4rem 0.875rem', borderRadius: '20px', cursor: 'not-allowed', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }} disabled>
                            <i className="fas fa-clock"></i>Processing
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Prescriptions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {prescriptions.map((p: any) => (
                      <div key={p.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.doctor_name}</div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{p.status || 'Active'}</span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.date}</div>
                          </div>
                        </div>
                        {p.diagnosis && (
                          <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(61,140,140,0.05)', borderRadius: '8px', borderLeft: '3px solid var(--teal)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, marginBottom: '0.1rem' }}>Diagnosis</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.diagnosis}</div>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Medications</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.medications}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Dosage & Schedule</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.dosage}</div>
                            {p.frequency && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Freq: {p.frequency}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                          {p.duration && <div><span style={{ color: 'var(--text-muted)' }}>Duration:</span> <span style={{ fontWeight: 500 }}>{p.duration}</span></div>}
                          {p.quantity && <div><span style={{ color: 'var(--text-muted)' }}>Quantity:</span> <span style={{ fontWeight: 500 }}>{p.quantity}</span></div>}
                        </div>
                        {p.instructions && (
                          <div style={{ background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.3)', borderRadius: '8px', padding: '0.625rem 0.875rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.2rem' }}>
                              <i className="fas fa-info-circle" style={{ marginRight: '0.3rem' }}></i>Instructions
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.instructions}</div>
                          </div>
                        )}
                        {p.notes && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Note: {p.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile */}
              {activeTab === 'profile' && (
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Profile</h3>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ width: '72px', height: '72px', background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem', color: 'white', fontWeight: 700 }}>
                      {(patient?.name || 'P').charAt(0)}
                    </div>
                    <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{patient?.name || 'Patient'}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {patient?.phone ? `+91 ${patient.phone}` : <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>Phone not on record</span>}
                    </p>
                    <span className="nabh-badge" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
                      <i className="fas fa-shield-alt"></i>Verified Patient
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                    {[
                      { icon: 'fas fa-id-card', label: 'Patient ID', value: patient?.patient_id || 'N/A' },
                      { icon: 'fas fa-phone', label: 'Phone', value: patient?.phone || 'Not on record' },
                      { icon: 'fas fa-birthday-cake', label: 'Age', value: patient?.age ? `${patient.age} Yrs` : 'N/A' },
                      { icon: 'fas fa-tint', label: 'Blood Group', value: patient?.blood_group || 'N/A' },
                      { icon: 'fas fa-user-md', label: 'Primary Doctor', value: appointments[0]?.doctor_name || 'Not Assigned' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                        <i className={item.icon} style={{ color: 'var(--teal)', width: '20px', textAlign: 'center' }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.875rem', color: item.value === 'Not on record' ? '#e74c3c' : 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(61,140,140,0.06)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-info-circle" style={{ color: 'var(--teal)' }}></i>
                      To update your details, please contact the hospital reception.
                    </div>
                  </div>
                </div>
              )}

              {/* Family Records */}
              {activeTab === 'family' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Family Records</h3>
                    {viewingMember && (
                      <button onClick={() => { setViewingMember(null); setMemberRecords(null); }}
                        style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className="fas fa-arrow-left"></i> Back to Family
                      </button>
                    )}
                  </div>

                  {/* OTP verification for a family member */}
                  {familyOtpTarget && familyOtpSent && !viewingMember && (
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ background: familyWhatsappSent ? 'rgba(37,211,102,0.08)' : 'rgba(61,140,140,0.08)', border: `1px solid ${familyWhatsappSent ? '#25D366' : 'var(--teal)'}`, borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <i className="fab fa-whatsapp" style={{ fontSize: '1.4rem', color: '#25D366', flexShrink: 0 }}></i>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {familyWhatsappSent ? 'OTP sent via WhatsApp ✓' : 'OTP ready (demo mode)'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {familyOtpMasked ? `Sent to: ${familyOtpMasked}` : familyOtpTarget.full_name}
                            {!familyWhatsappSent && <span style={{ color: 'var(--teal)', fontWeight: 600 }}> · Use 123456</span>}
                          </div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Enter OTP to view records for <strong>{familyOtpTarget.full_name}</strong>
                      </p>
                      <OTPInput onComplete={verifyFamilyOTP} />
                      <button onClick={() => { setFamilyOtpSent(false); setFamilyOtpTarget(null); }}
                        style={{ marginTop: '0.875rem', background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i>Cancel
                      </button>
                    </div>
                  )}

                  {/* Viewing a member's records */}
                  {viewingMember && memberRecords && (
                    <div>
                      <div style={{ background: 'rgba(61,140,140,0.08)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '44px', height: '44px', background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                          {(viewingMember.full_name || 'P').charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{viewingMember.full_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {viewingMember.age ? `${viewingMember.age} yrs` : ''}{viewingMember.blood_group ? ` · ${viewingMember.blood_group}` : ''} · ID: {viewingMember.id}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setBookingForPatientId(viewingMember.id);
                            setBookingForName(viewingMember.full_name);
                            setBookingForPhone(viewingMember.phone || patient?.phone || '');
                            setBookingForAge(viewingMember.age || '');
                            setShowBooking(true);
                          }}
                          style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <i className="fas fa-calendar-plus"></i> Book Appointment
                        </button>
                      </div>
                      {loadingMemberRecords ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                          Loading records...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {/* Member appointments */}
                          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.95rem' }}>
                              <i className="fas fa-calendar-check" style={{ color: 'var(--teal)', marginRight: '0.5rem' }}></i>Appointments ({memberRecords.appointments.length})
                            </h4>
                            {memberRecords.appointments.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No appointments found.</p>
                            ) : memberRecords.appointments.slice(0, 20).map((a: any, idx: number) => (
                              <div key={`${a.id}_${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.doctor_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date} at {a.time}</div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '10px', background: `${statusColor(a.status)}18`, color: statusColor(a.status) }}>{a.status}</span>
                              </div>
                            ))}
                          </div>
                          {/* Member reports */}
                          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.95rem' }}>
                              <i className="fas fa-file-medical" style={{ color: 'var(--teal)', marginRight: '0.5rem' }}></i>Reports ({memberRecords.reports.length})
                            </h4>
                            {memberRecords.reports.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No reports found.</p>
                            ) : memberRecords.reports.slice(0, 20).map((r: any, idx: number) => (
                              <div key={`${r.id}_${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.date}</div>
                                </div>
                                {r.file_url && (
                                  <a href={r.file_url} download style={{ textDecoration: 'none' }}>
                                    <button style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                      <i className="fas fa-download"></i>
                                    </button>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Prescriptions */}
                          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.95rem' }}>
                              <i className="fas fa-prescription-bottle-alt" style={{ color: 'var(--teal)', marginRight: '0.5rem' }}></i>Prescriptions ({memberRecords.prescriptions.length})
                            </h4>
                            {memberRecords.prescriptions.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No prescriptions found.</p>
                            ) : memberRecords.prescriptions.map((p: any, idx: number) => (
                              <div key={`${p.id}_${idx}`} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.doctor_name}</div>
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{p.status || 'Active'}</span>
                                </div>
                                {p.diagnosis && <div style={{ fontSize: '0.78rem', color: 'var(--teal)', marginBottom: '0.2rem' }}>Dx: {p.diagnosis}</div>}
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {p.medications && <span><strong>Rx:</strong> {p.medications}</span>}
                                  {p.dosage && <span style={{ marginLeft: '0.5rem' }}>· {p.dosage}</span>}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{p.date}</div>
                              </div>
                            ))}
                          </div>

                          {/* Lab Orders */}
                          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.95rem' }}>
                              <i className="fas fa-flask" style={{ color: 'var(--teal)', marginRight: '0.5rem' }}></i>Lab Orders ({memberRecords.labOrders.length})
                            </h4>
                            {memberRecords.labOrders.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No lab orders found.</p>
                            ) : memberRecords.labOrders.map((lo: any, idx: number) => (
                              <div key={`${lo.id}_${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lo.test_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lo.doctor_name} · {lo.order_date}</div>
                                  {lo.amount && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{lo.amount}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '10px', background: lo.status === 'Completed' ? 'rgba(39,174,96,0.1)' : 'rgba(241,196,15,0.1)', color: lo.status === 'Completed' ? '#27ae60' : '#f1c40f' }}>{lo.status}</span>
                                  {lo.result && <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '0.2rem', fontWeight: 600 }}>Result: {lo.result}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Family member list */}
                  {!familyOtpTarget && !viewingMember && (
                    <div>
                      {loadingFamily ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                          Loading family members...
                        </div>
                      ) : familyMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <i className="fas fa-users" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}></i>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Other Family Members</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No other patients are registered under this phone number.</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            <i className="fas fa-lock" style={{ marginRight: '0.4rem', color: 'var(--teal)' }}></i>
                            Select a family member to view their records. An OTP will be sent for verification.
                          </p>
                          {familyMembers.map((member: any) => (
                            <div key={member.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                              <div style={{ width: '44px', height: '44px', background: 'rgba(61,140,140,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                                {(member.full_name || 'P').charAt(0)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{member.full_name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                  {member.age ? `${member.age} yrs` : ''}{member.gender ? ` · ${member.gender}` : ''}{member.blood_group ? ` · ${member.blood_group}` : ''}
                                </div>
                              </div>
                              <button
                                onClick={() => sendFamilyOTP(member)}
                                disabled={familySending}
                                style={{ background: 'var(--teal)', border: 'none', color: 'white', padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                {familySending && familyOtpTarget?.id === member.id
                                  ? <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                                  : <><i className="fas fa-eye"></i> View Records</>}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Book Appointment Modal (from portal) ── */}
        {showBooking && (
          <PortalBookingModal
            patientId={bookingForPatientId}
            patientName={bookingForName}
            patientPhone={bookingForPhone || patient?.phone || ''}
            patientAge={bookingForAge || patient?.age}
            onClose={() => setShowBooking(false)}
          />
        )}
      </div>
    </div>
  );
}
