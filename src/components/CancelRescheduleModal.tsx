import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchDoctors,
  fetchSlots,
  searchAppointments,
  cancelAppointmentRequest,
  rescheduleAppointment,
  lockSlot,
  unlockSlot,
  Doctor,
} from '../api';

interface Props {
  onClose: () => void;
}

export default function CancelRescheduleModal({ onClose }: Props) {
  // ── Search state ──────────────────────────────────────────────
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelDate, setCancelDate] = useState('');
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // ── Cancel state ──────────────────────────────────────────────
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Reschedule state ──────────────────────────────────────────
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [reschedulingDoctor, setReschedulingDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lockToken] = useState(() => Math.random().toString(36).substring(2, 11));
  const [rescheduleDone, setRescheduleDone] = useState(false);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch doctors for reschedule matching
  useEffect(() => {
    fetchDoctors().then(res => {
      const data = res?.data ?? (Array.isArray(res) ? res : []);
      setDoctors(data);
    }).catch(() => {});
  }, []);

  // Load slots when date changes during reschedule
  useEffect(() => {
    if (!reschedulingDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    fetchSlots(reschedulingDoctor.id, selectedDate, lockToken)
      .then(res => {
        const slots = res.data || (Array.isArray(res) ? res : []);
        setAvailableSlots(slots);
      })
      .catch(() => toast.error('Could not load time slots.'))
      .finally(() => setLoadingSlots(false));
  }, [reschedulingDoctor, selectedDate, lockToken]);

  // Countdown timer for locked slot
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        toast.info('Slot hold expired. Please select again.');
        setSelectedSlot('');
        unlockSlot(lockToken).catch(() => {});
        setTimeLeft(null);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, lockToken]);

  // ── Calendar helpers ──────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ── Handlers ──────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!cancelPhone || !cancelDate) {
      toast.error('Please enter both phone number and date.');
      return;
    }
    setSearching(true);
    try {
      const res = await searchAppointments(cancelPhone, cancelDate);
      if (res.success) {
        setSearchResult(res.data);
        if (res.data.length === 0) toast.info('No active appointments found.');
      }
    } catch { toast.error('Failed to search appointments.'); }
    finally { setSearching(false); }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingId || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await cancelAppointmentRequest(cancellingId, cancelReason);
      if (res.success) {
        toast.success('Appointment cancelled successfully.');
        setSearchResult(prev => prev.filter(a => a.id !== cancellingId));
        setShowReasonModal(false);
        setCancelReason('');
        setCancellingId(null);
      }
    } catch { toast.error('Failed to cancel appointment.'); }
    finally { setSubmitting(false); }
  };

  const handleSlotSelect = async (time: string, available: boolean) => {
    if (!available || !reschedulingDoctor || !selectedDate) return;
    if (selectedSlot === time) return;
    try {
      const res = await lockSlot(reschedulingDoctor.id, selectedDate, time, lockToken);
      if (res.success) {
        setSelectedSlot(time);
        setTimeLeft(420);
        toast.info('Slot held for 7 minutes! ⏱️');
      } else {
        toast.error(res.error || 'Could not lock slot');
      }
    } catch { toast.error('Failed to lock slot'); }
  };

  const handleRescheduleConfirm = async () => {
    if (!reschedulingId || !selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await rescheduleAppointment(reschedulingId, selectedDate, selectedSlot, lockToken);
      if (res.success) {
        toast.success('Appointment rescheduled successfully! 📅');
        setRescheduleDone(true);
        setTimeLeft(null);
        unlockSlot(lockToken).catch(() => {});
      } else {
        toast.error(res.error || 'Failed to reschedule.');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error processing reschedule');
    } finally { setSubmitting(false); }
  };

  // ── Styles ────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 10500,
    background: 'rgba(10, 25, 47, 0.72)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };
  const modal: React.CSSProperties = {
    background: '#fff',
    borderRadius: '24px',
    width: '100%', maxWidth: '560px',
    maxHeight: '92vh',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 32px 80px rgba(10,25,47,0.3)',
    animation: 'crm-enter 0.28s cubic-bezier(0.34,1.56,0.64,1)',
  };

  return (
    <>
      <style>{`
        @keyframes crm-enter {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .crm-slot {
          padding: 8px 14px; border-radius: 8px; border: 1.5px solid #E2E8F0;
          font-size: 0.8rem; font-weight: 500; cursor: pointer;
          background: #fff; color: #334155;
          transition: all 0.18s ease;
        }
        .crm-slot:hover:not(:disabled) { border-color: #14B8A6; color: #14B8A6; background: #F0FDFA; }
        .crm-slot.selected { background: #14B8A6; border-color: #14B8A6; color: #fff; }
        .crm-slot:disabled { opacity: 0.4; cursor: not-allowed; }
        .crm-cal-day {
          aspect-ratio:1; border-radius: 8px; border: none;
          background: #fff; font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .crm-cal-day:hover:not(:disabled) { background: #EFF; color: #14B8A6; }
        .crm-cal-day.selected { background: #14B8A6; color: #fff; font-weight: 700; }
        .crm-cal-day.today-day { border: 2px solid #14B8A6; color: #14B8A6; }
        .crm-cal-day:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={modal}>

          {/* ── Header ── */}
          <div style={{
            padding: '1.5rem 1.75rem 1.25rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
            borderRadius: '24px 24px 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="far fa-file-alt" style={{ fontSize: '1.1rem', color: '#fff' }} />
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {isRescheduling ? 'Reschedule Appointment' : 'Cancel / Reschedule'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: 0 }}>
                  {isRescheduling
                    ? `Rescheduling with Dr. ${reschedulingDoctor?.name}`
                    : 'Find your appointment by phone & date'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: '8px', width: 34, height: 34,
                cursor: 'pointer', color: '#fff', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

            {/* ══ RESCHEDULE DONE ══ */}
            {rescheduleDone && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #14B8A6, #0F766E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
                }}>
                  <i className="fas fa-check" style={{ fontSize: '1.8rem', color: '#fff' }} />
                </div>
                <h3 style={{ color: '#0F2D52', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Appointment Rescheduled!
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Your appointment has been updated successfully. You will receive a confirmation shortly.
                </p>
                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6, #0F766E)',
                    color: '#fff', border: 'none', borderRadius: '50px',
                    padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 600,
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(20,184,166,0.3)',
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* ══ RESCHEDULE FLOW ══ */}
            {!rescheduleDone && isRescheduling && (
              <div>
                <button
                  onClick={() => { setIsRescheduling(false); setSelectedDate(''); setSelectedSlot(''); }}
                  style={{
                    background: 'none', border: 'none', color: '#14B8A6',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', padding: 0,
                  }}
                >
                  <i className="fas fa-arrow-left" /> Back to search
                </button>

                {/* Doctor info */}
                <div style={{
                  background: '#F0FDFA', borderRadius: '12px', padding: '1rem',
                  border: '1px solid rgba(20,184,166,0.2)', marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #14B8A6, #0F766E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-user-md" style={{ color: '#fff', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F2D52', fontSize: '0.95rem' }}>
                      Dr. {reschedulingDoctor?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#14B8A6', fontWeight: 500 }}>
                      {reschedulingDoctor?.specialization}
                    </div>
                  </div>
                </div>

                {/* Mini Calendar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                      style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', width: 30, height: 30, cursor: 'pointer', color: '#64748B' }}>
                      <i className="fas fa-chevron-left" style={{ fontSize: '0.7rem' }} />
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F2D52' }}>
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                      style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', width: 30, height: 30, cursor: 'pointer', color: '#64748B' }}>
                      <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', padding: '4px 0' }}>{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const d = new Date(year, month, day);
                      const ds = fmt(d);
                      const isPast = d < today;
                      return (
                        <button
                          key={day}
                          disabled={isPast}
                          onClick={() => { setSelectedDate(ds); setSelectedSlot(''); }}
                          className={`crm-cal-day${selectedDate === ds ? ' selected' : ''}${fmt(today) === ds ? ' today-day' : ''}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots */}
                {selectedDate && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.6rem' }}>
                      <i className="fas fa-clock" style={{ marginRight: '0.4rem', color: '#14B8A6' }} />
                      Available Time Slots
                      {timeLeft !== null && (
                        <span style={{ marginLeft: '0.75rem', background: timeLeft <= 60 ? '#FEF2F2' : '#F0FDFA', color: timeLeft <= 60 ? '#EF4444' : '#14B8A6', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} left
                        </span>
                      )}
                    </label>
                    {loadingSlots ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />Loading slots...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                        No slots available for this date.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {availableSlots.map((s: any) => (
                          <button
                            key={s.time}
                            disabled={!s.is_available}
                            onClick={() => handleSlotSelect(s.time, s.is_available)}
                            className={`crm-slot${selectedSlot === s.time ? ' selected' : ''}`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleRescheduleConfirm}
                  disabled={!selectedDate || !selectedSlot || submitting}
                  style={{
                    width: '100%', padding: '0.85rem',
                    background: selectedDate && selectedSlot
                      ? 'linear-gradient(135deg, #14B8A6, #0F766E)'
                      : '#E2E8F0',
                    color: selectedDate && selectedSlot ? '#fff' : '#94A3B8',
                    border: 'none', borderRadius: '12px',
                    fontSize: '0.95rem', fontWeight: 600,
                    cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: selectedDate && selectedSlot ? '0 4px 14px rgba(20,184,166,0.3)' : 'none',
                  }}
                >
                  {submitting
                    ? <><i className="fas fa-spinner fa-spin" /> Processing...</>
                    : <><i className="fas fa-calendar-check" /> Confirm Reschedule</>}
                </button>
              </div>
            )}

            {/* ══ SEARCH FLOW ══ */}
            {!rescheduleDone && !isRescheduling && (
              <div>
                {/* Phone + Date inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>
                      <i className="fas fa-phone" style={{ marginRight: '0.35rem', color: '#14B8A6' }} />
                      Phone Number
                    </label>
                    <input
                      value={cancelPhone}
                      onChange={e => setCancelPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      type="tel"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <i className="fas fa-calendar-alt" style={{ marginRight: '0.35rem', color: '#14B8A6' }} />
                      Appointment Date
                    </label>
                    <input
                      value={cancelDate}
                      onChange={e => setCancelDate(e.target.value)}
                      type="date"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={searching}
                  style={{
                    width: '100%', padding: '0.75rem',
                    background: 'linear-gradient(135deg, #14B8A6, #0F766E)',
                    color: '#fff', border: 'none', borderRadius: '12px',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 14px rgba(20,184,166,0.25)',
                  }}
                >
                  {searching
                    ? <><i className="fas fa-spinner fa-spin" /> Searching...</>
                    : <><i className="fas fa-search" /> Search Appointments</>}
                </button>

                {/* Results */}
                {searchResult.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
                      <i className="fas fa-list" style={{ marginRight: '0.4rem', color: '#14B8A6' }} />
                      Found {searchResult.length} Appointment{searchResult.length > 1 ? 's' : ''}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchResult.map((appt: any) => (
                        <div key={appt.id} style={{
                          padding: '1.1rem 1.25rem',
                          background: '#F8FAFC',
                          borderRadius: '14px',
                          border: '1px solid #E2E8F0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F2D52', fontSize: '0.95rem' }}>
                                {appt.doctor_name}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                                <i className="fas fa-clock" style={{ marginRight: '0.3rem', color: '#14B8A6' }} />{appt.time}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                Ref: <span style={{ color: '#14B8A6', fontWeight: 600 }}>{appt.reference_number}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  const doc = doctors.find(d => String(d.id) === String(appt.doctor_id));
                                  if (doc) {
                                    setReschedulingDoctor(doc);
                                    setReschedulingId(appt.id);
                                    setIsRescheduling(true);
                                    setSelectedDate('');
                                    setSelectedSlot('');
                                  } else {
                                    toast.error('Doctor not found. Please try again.');
                                  }
                                }}
                                style={{
                                  background: '#F0FDFA', border: '1.5px solid #14B8A6',
                                  color: '#14B8A6', borderRadius: '8px',
                                  padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                  transition: 'all 0.18s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#14B8A6'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.color = '#14B8A6'; }}
                              >
                                <i className="fas fa-calendar-alt" style={{ marginRight: '0.3rem' }} />
                                Reschedule
                              </button>
                              <button
                                onClick={() => { setCancellingId(appt.id); setShowReasonModal(true); }}
                                style={{
                                  background: '#FEF2F2', border: '1.5px solid #EF4444',
                                  color: '#EF4444', borderRadius: '8px',
                                  padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                  transition: 'all 0.18s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                              >
                                <i className="fas fa-times-circle" style={{ marginRight: '0.3rem' }} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cancel Reason Modal ── */}
      {showReasonModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10600,
          background: 'rgba(10,25,47,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '2rem', width: '100%', maxWidth: '420px',
            boxShadow: '0 24px 60px rgba(10,25,47,0.25)',
            animation: 'crm-enter 0.22s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#EF4444', fontSize: '1rem' }} />
              </div>
              <div>
                <h4 style={{ color: '#0F2D52', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Cancel Appointment</h4>
                <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: 0 }}>Please provide a reason</p>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Cancellation <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, feeling better, etc."
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={() => { setShowReasonModal(false); setCancelReason(''); setCancellingId(null); }}
                style={{
                  flex: 1, padding: '0.75rem', background: '#F1F5F9',
                  border: 'none', borderRadius: '10px', fontWeight: 600,
                  color: '#64748B', cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={submitting || !cancelReason.trim()}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: cancelReason.trim() ? 'linear-gradient(135deg, #EF4444, #B91C1C)' : '#E2E8F0',
                  border: 'none', borderRadius: '10px', fontWeight: 600,
                  color: cancelReason.trim() ? '#fff' : '#94A3B8',
                  cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {submitting ? <><i className="fas fa-spinner fa-spin" /> Processing...</> : <><i className="fas fa-times-circle" /> Confirm Cancel</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
