import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/apiClient';
import { Doctor, fetchDoctors, fetchSlots, bookAppointment, searchAppointments, cancelAppointmentRequest, rescheduleAppointment, searchPatient, lockSlot, unlockSlot, requestPatientOTP, verifyPatientOTP, getPatientsByPhone } from '../api';

interface AppointmentSectionProps {
  preSelectedDoctor?: Doctor;
  initialCancelMode?: boolean;
  onClose?: () => void;
}

function AnimCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return <div ref={ref} className="fade-in-up">{children}</div>;
}

export default function AppointmentSection({ preSelectedDoctor, initialCancelMode = false }: AppointmentSectionProps) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(preSelectedDoctor);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [ageAutoCalculated, setAgeAutoCalculated] = useState(false);
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [village, setVillage] = useState('');
  const [description, setDescription] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [dept, setDept] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [visitType, setVisitType] = useState('Consultation');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorOnLeave, setDoctorOnLeave] = useState(false);
  const [lockToken] = useState(() => Math.random().toString(36).substring(2, 11));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmedPatientId, setConfirmedPatientId] = useState('');
  const timerRef = useRef<any | null>(null);

  const [manualPatientEntry, setManualPatientEntry] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [isPatientFound, setIsPatientFound] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);

  // OTP Verification State
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  // Refs to hold latest flag values - these are readable inside async closures without stale data
  const manualEntryRef = useRef(false);
  const patientFoundRef = useRef(false);
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // OTP Verification Functions
  const handleRequestOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setVerifyingOTP(true);
      const response = await requestPatientOTP(phone);
      
      if (response.success) {
        setOtpSent(true);
        setShowOTPVerification(true);
        setMaskedPhone(response.phone_masked);
        toast.success(response.message);
      } else {
        // Patient not found - show as new patient
        setIsNewPatient(true);
        setOtpVerified(true);
        setShowOTPVerification(false);
        toast.info('New patient detected. Please fill in your details.');
      }
    } catch (error: any) {
      console.error('OTP request error:', error);
      if (error.response?.status === 404) {
        // Patient not found - treat as new patient
        setIsNewPatient(true);
        setOtpVerified(true);
        setShowOTPVerification(false);
        toast.info('New patient detected. Please fill in your details.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to send OTP');
      }
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOTP(true);
      const response = await verifyPatientOTP(phone, otpCode);
      
      if (response.success) {
        setOtpVerified(true);
        setShowOTPVerification(false);
        
        // Get all patients for this phone number
        const patientsResponse = await getPatientsByPhone(phone);
        if (patientsResponse.success && patientsResponse.data.length > 0) {
          setAvailablePatients(patientsResponse.data);
          
          if (patientsResponse.data.length === 1) {
            // Auto-select if only one patient
            handleSelectPatient(patientsResponse.data[0]);
          }
          
          toast.success('Phone verified! Please select your profile.');
        } else {
          toast.error('No patient profiles found for this number');
        }
      } else {
        toast.error(response.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatientData(patient);
    setSelectedPatientId(patient.id);
    setIsPatientFound(true);
    
    // Auto-fill form fields
    setName(patient.full_name || '');
    setAge(patient.age?.toString() || '');
    setAgeAutoCalculated(false); // Reset auto-calculated flag when loading patient data
    setGender(patient.gender || '');
    setEmail(patient.email || '');
    setAddress(patient.address || '');
    setPincode(patient.pincode || '');
    setCity(patient.city || '');
    setStateName(patient.state || '');
    setVillage(patient.village || '');
    
    if (patient.date_of_birth) {
      setDob(patient.date_of_birth);
    }
    
    toast.success(`Welcome back, ${patient.full_name}!`);
  };

  const resetPatientVerification = () => {
    setShowOTPVerification(false);
    setOtpSent(false);
    setOtpCode('');
    setOtpVerified(false);
    setMaskedPhone('');
    setAvailablePatients([]);
    setSelectedPatientData(null);
    setSelectedPatientId(null);
    setIsPatientFound(false);
    setIsNewPatient(false);
    setAgeAutoCalculated(false);
  };

  // Keep refs in sync with state
  useEffect(() => { manualEntryRef.current = manualPatientEntry; }, [manualPatientEntry]);
  useEffect(() => { patientFoundRef.current = !!selectedPatientId || (patientSearchResults.length === 1 && !manualPatientEntry); }, [selectedPatientId, patientSearchResults, manualPatientEntry]);

  // Helper to set manual mode - updates both state AND the ref immediately
  const enterManualMode = () => {
    manualEntryRef.current = true;
    setManualPatientEntry(true);
  };

  // Cancellation Flow State
  const [isCancelMode, setIsCancelMode] = useState(initialCancelMode);
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelDate, setCancelDate] = useState('');
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Rescheduling state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Follow-up eligibility state
  const [followupInfo, setFollowupInfo] = useState<{
    has_previous_visit: boolean;
    is_free_followup: boolean;
    is_followup_eligible: boolean;
    days_since_last: number | null;
    followup_count: number;
    max_followup_count: number;
    remaining_followups: number;
    followup_fee: number;
    consultation_fee: number;
  } | null>(null);
  const [checkingFollowup, setCheckingFollowup] = useState(false);

  // Trigger followup check whenever patient + doctor are both known
  useEffect(() => {
    if (!selectedPatientId || !selectedDoctor?.id) {
      setFollowupInfo(null);
      return;
    }
    let cancelled = false;
    const check = async () => {
      setCheckingFollowup(true);
      try {
        const res = await apiClient.get(`/homepage/followup-check?patient_id=${selectedPatientId}&doctor_id=${selectedDoctor.id}`);
        if (cancelled) return;
        const json = res.data;
        if (json.success && !cancelled) {
          const info = json.data;
          setFollowupInfo(info);
          // Auto-set visit type based on eligibility
          if (info.is_followup_eligible) {
            setVisitType('follow_up');
          } else {
            setVisitType('Consultation');
          }
        }
      } catch (e) {
        console.error('Followup check failed:', e);
      } finally {
        if (!cancelled) setCheckingFollowup(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [selectedPatientId, selectedDoctor?.id]);

  // Fetch doctors from database
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await fetchDoctors();
        // Correctly handle the response object { data: Doctor[], success: boolean }
        if (result && Array.isArray(result.data)) {
          setDoctors(result.data);
        } else if (Array.isArray(result)) {
          // Fallback if the API ever returns a direct array
          setDoctors(result);
        } else {
          console.warn('Unexpected doctors data format:', result);
          setDoctors([]);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctors([]);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (preSelectedDoctor) {
      setSelectedDoctor(preSelectedDoctor);
      setDept(preSelectedDoctor.department);
      if (!isRescheduling) setStep(2);
    }
  }, [preSelectedDoctor, isRescheduling]);

  // Sync isCancelMode with initialCancelMode prop when it changes
  useEffect(() => {
    setIsCancelMode(initialCancelMode);
  }, [initialCancelMode]);

  // Fetch slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const loadSlots = async () => {
        setLoadingSlots(true);
        setDoctorOnLeave(false);
        try {
          const res = await fetchSlots(selectedDoctor.id, selectedDate, lockToken);
          // res is now the full response object
          const slots = res.data || (Array.isArray(res) ? res : []);
          if (res.on_leave) {
            setDoctorOnLeave(true);
            setAvailableSlots([]);
          } else {
            setAvailableSlots(slots);
          }
        } catch (error) {
          console.error('Error fetching slots:', error);
          toast.error('Could not load time slots. Please try again.');
        } finally {
          setLoadingSlots(false);
        }
      };
      loadSlots();
    } else {
      setDoctorOnLeave(false);
    }
  }, [selectedDoctor, selectedDate, lockToken]);

  // Reservation Timer Logic
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      toast.info('Slot selection expired. Please select again.');
      setSelectedSlot('');
      unlockSlot(lockToken).catch(console.error);
      setTimeLeft(null);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, lockToken]);

  const handleSlotSelection = async (time: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    if (selectedSlot === time) return; // Already selected

    try {
      if (selectedDoctor && selectedDate) {
        const res = await lockSlot(selectedDoctor.id, selectedDate, time, lockToken);
        if (res.success) {
          setSelectedSlot(time);
          setTimeLeft(420); // 7 minutes
          toast.info(`Slot held for 7 minutes! ⏱️`);
        } else {
          toast.error(res.error || 'Could not lock slot');
        }
      }
    } catch (error: any) {
      console.error('Lock error:', error);
      toast.error(error.response?.data?.error || 'Failed to lock slot');
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Patient search debounce - only re-runs when actual search terms change
  useEffect(() => {
    // Basic guards - don't search if we already chose someone or are rescheduling
    if (patientFoundRef.current || isRescheduling) {
      return;
    }

    let query = '';
    const isPhoneSearch = phone.length >= 10;
    
    // Priority: If phone is 10+ digits, it's a primary identification key
    if (isPhoneSearch) query = phone;
    else if (phone.length > 5) query = phone; // Partial phone search
    else if (email.includes('@')) query = email;
    else if (name.trim().length > 2) query = name.trim();
    else if (age.length > 0) query = age;

    if (!query) {
      setPatientSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Final guard check before starting the search
      if (patientFoundRef.current) return;

      setSearchingPatient(true);
      try {
        const results = await searchPatient(query);
        // If results come back, update the selection search results
        if (results && results.length > 0) {
          setPatientSearchResults(results);
          // Ensure we don't auto-set identification until explicitly selected
          setIsPatientFound(false);
          setSelectedPatientId(null);
        } else {
          setPatientSearchResults([]);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchingPatient(false);
      }
    }, 500);

    return () => clearTimeout(timer);
    // Runs when identification fields change
  }, [name, phone, age, email, isRescheduling]);

  // Pincode Lookup logic
  useEffect(() => {
    if (pincode.length === 6) {
      const fetchAddress = async () => {
        try {
          const response = await fetch(`https://api.zippopotam.us/IN/${pincode}`);
          if (response.ok) {
            const data = await response.json();
            if (data.places && data.places.length > 0) {
              const place = data.places[0];
              setCity(place['place name']);
              setStateName(place.state);
              toast.success(`Location found: ${place['place name']}, ${place.state}`);
            }
          }
        } catch (error) {
          console.error('Pincode lookup failed:', error);
        }
      };
      fetchAddress();
    }
  }, [pincode]);

  const handleDateSelect = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (d < today) return;
    setSelectedDate(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setSelectedSlot('');
  };

  const handleReschedule = async () => {
    if (!reschedulingId || !selectedDate || !selectedSlot) {
      toast.error('Please select both date and time.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await rescheduleAppointment(reschedulingId, selectedDate, selectedSlot, lockToken);
      if (res.success) {
        toast.success('Appointment rescheduled successfully!');
        setConfirmed(true);
        setIsRescheduling(false);
        setTimeLeft(null);
        unlockSlot(lockToken).catch(console.error);
      }
    } catch (error: any) {
      console.error('Reschedule error:', error);
      toast.error(error.response?.data?.error || 'Failed to reschedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !age) { 
        toast.error('Please fill all required fields (Name, Phone, Age).'); 
        return; 
    }
    // Phone validation
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
    }
    setSubmitting(true);
    try {
      // Construct address from multiple fields if provided
      const finalAddress = village || city || stateName || pincode 
        ? `${village}${village ? ', ' : ''}${city}${city ? ', ' : ''}${stateName}${stateName ? ' - ' : ''}${pincode}`.trim()
        : address;

      const bookingData = {
        doctor_id: selectedDoctor?.id,
        patient_id: selectedPatientId,
        patient_name: name,
        patient_phone: phone,
        patient_email: email,
        patient_dob: dob,
        patient_gender: gender,
        patient_address: finalAddress,
        patient_age: parseInt(age),
        description: description,
        visit_type: visitType,
        date: selectedDate,
        time: selectedSlot,
        lock_token: lockToken
      };

      const res = await bookAppointment(bookingData);
      if (res.reference) {
        setRefNumber(res.reference);
        if (res.patient_id) {
          setConfirmedPatientId(res.patient_id);
        }
        setIsNewPatient(res.is_new_patient || false);
        setConfirmed(true);
        toast.success(res.message || 'Appointment booked! 🎉');
      }
      setTimeLeft(null);
      unlockSlot(lockToken).catch(console.error);
    } catch (error: any) {
      console.error('Booking error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Booking failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchCancel = async () => {
    if (!cancelPhone || !cancelDate) {
      toast.error('Please enter both phone number and date.');
      return;
    }
    setSearching(true);
    try {
      const res = await searchAppointments(cancelPhone, cancelDate);
      if (res.success) {
        setSearchResult(res.data);
        if (res.data.length === 0) {
          toast.info('No active appointments found for this phone and date.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search appointments.');
    } finally {
      setSearching(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingId || !cancelReason) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await cancelAppointmentRequest(cancellingId, cancelReason);
      if (res.success) {
        toast.success('Appointment cancelled successfully.');
        setSearchResult(searchResult.filter(a => a.id !== cancellingId));
        setShowReasonModal(false);
        setCancelReason('');
        setCancellingId(null);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Failed to cancel appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setDept('');
    setSelectedDoctor(undefined);
    setSelectedDate('');
    setSelectedSlot('');
    setName('');
    setPhone('');
    setAge('');
    setEmail('');
    setDob('');
    setAgeAutoCalculated(false);
    setGender('');
    setAddress('');
    setPincode('');
    setCity('');
    setStateName('');
    setVillage('');
    setDescription('');
    setVisitType('Consultation');
    setConfirmed(false);
    setRefNumber('');
    setConfirmedPatientId('');
    setIsRescheduling(false);
    setReschedulingId(null);
    setIsPatientFound(false);
    setSelectedPatientId(null);
    setPatientSearchResults([]);
    setIsNewPatient(false);
  };

  const whyPoints = [
    { icon: 'fas fa-bolt', title: 'Instant Confirmation', desc: 'Get immediate booking confirmation via SMS & email' },
    { icon: 'fas fa-user-md', title: 'Choose Your Doctor', desc: 'Browse and select from 200+ expert specialists' },
    { icon: 'fas fa-clock', title: 'Flexible Timings', desc: 'Multiple time slots available across all days' },
    { icon: 'fas fa-calendar-alt', title: 'Easy Rescheduling', desc: 'Reschedule or cancel with just a click anytime' },
  ];

  const stepLabels = ['Choose Doctor', 'Select Date & Time', 'Patient Details', 'Confirmation'];

  // Get unique departments from doctors
  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const departments = ['All', ...new Set(safeDoctors.map(d => d.department).filter(Boolean))];

  // Filter doctors by selected department
  const availableDoctors = dept ? safeDoctors.filter(d => d.department === dept) : safeDoctors;

  const displaySlots = availableSlots;

  return (
    <section id="appointments" className="section-pad" style={{ background: 'var(--bg-primary)' }}>
      <div className="container">
        <AnimCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="section-title">{isCancelMode ? 'Cancel Your Appointment' : 'Book Your Appointment Online'}</h2>
              <div className="section-divider"></div>
              <p className="section-subtitle">
                {isCancelMode 
                  ? 'Enter your phone number and appointment date to find and cancel your booking.' 
                  : 'No long queues. Book from the comfort of your home and receive instant confirmation.'}
              </p>
            </div>
          </div>
        </AnimCard>

        <style>{`
          @media (max-width: 768px) {
            .why-book-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 0.75rem !important;
              margin-bottom: 2rem !important;
            }
            .why-book-card {
              padding: 1rem 0.5rem !important;
            }
            .why-book-icon-wrapper {
              width: 36px !important;
              height: 36px !important;
              margin-bottom: 0.5rem !important;
            }
            .why-book-icon {
              font-size: 1rem !important;
            }
            .why-book-title {
              font-size: 0.8rem !important;
              margin-bottom: 0.2rem !important;
              line-height: 1.2 !important;
            }
            .why-book-desc {
              font-size: 0.65rem !important;
              line-height: 1.3 !important;
            }
          }
        `}</style>
        {/* Why Book Online */}
        <div className="why-book-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {whyPoints.map((p, i) => (
            <AnimCard key={i}>
              <div className="why-book-card" style={{ background: 'var(--card-bg)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s', height: '100%' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
                <div className="why-book-icon-wrapper" style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                  <i className={`why-book-icon ${p.icon}`} style={{ fontSize: '1.3rem', color: 'var(--teal)' }}></i>
                </div>
                <h4 className="why-book-title" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{p.title}</h4>
                <p className="why-book-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </AnimCard>
          ))}
        </div>

        {/* Main Form */}
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
            {isCancelMode ? (
              /* CANCELLATION VIEW */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label><i className="fas fa-phone" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Phone Number</label>
                    <input 
                      value={cancelPhone} 
                      onChange={e => setCancelPhone(e.target.value)} 
                      placeholder="10-digit mobile" 
                      type="tel" 
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-calendar-alt" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Appointment Date</label>
                    <input 
                      value={cancelDate} 
                      onChange={e => setCancelDate(e.target.value)} 
                      type="date" 
                    />
                  </div>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={handleSearchCancel} 
                  disabled={searching}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem' }}
                >
                  {searching ? <><i className="fas fa-spinner fa-spin"></i> Searching...</> : <><i className="fas fa-search"></i> Search Appointments</>}
                </button>

                {searchResult.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Found Appointments:</h4>
                    {searchResult.map((appt: any) => (
                      <div key={appt.id} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '15px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1rem' }}>{appt.doctor_name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <i className="fas fa-clock" style={{ marginRight: '0.4rem' }}></i>{appt.time}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--teal)', marginTop: '0.2rem' }}>Ref: {appt.reference_number}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              const doc = doctors.find(d => d.id === appt.doctor_id);
                              if (doc) {
                                setSelectedDoctor(doc);
                                setReschedulingId(appt.id);
                                setIsRescheduling(true);
                                setIsCancelMode(false);
                                setStep(2);
                                toast.info(`Rescheduling appointment with Dr. ${doc.name}. Please select a new date and time.`);
                              } else {
                                toast.error('Doctor information not found.');
                              }
                            }}
                            className="btn-outline"
                            style={{ borderColor: 'var(--teal)', color: 'var(--teal)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                          >
                            Reschedule
                          </button>
                          <button 
                            onClick={() => {
                              setCancellingId(appt.id);
                              setShowReasonModal(true);
                            }}
                            className="btn-outline"
                            style={{ borderColor: '#EF4444', color: '#EF4444', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !confirmed ? (
              <>
                {/* Step Indicator */}
                <div className="step-indicator">
                  {stepLabels.map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                        <div className={`step-dot ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : 'inactive'}`}>
                          {step > i + 1 ? <i className="fas fa-check"></i> : i + 1}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'none' }}>{label}</span>
                      </div>
                      {i < stepLabels.length - 1 && <div className={`step-line ${step > i + 1 ? 'completed' : ''}`} style={{ margin: '0 4px' }}></div>}
                    </div>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.75rem', marginBottom: '1.75rem' }}>
                  Step {step} of {stepLabels.length}: <strong>{stepLabels[step - 1]}</strong>
                </p>

                {/* STEP 1 */}
                {step === 1 && (
                  <div>
                    <div className="form-group">
                      <label><i className="fas fa-hospital" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Select Department</label>
                      <select value={dept} onChange={e => { setDept(e.target.value); setSelectedDoctor(undefined); }}>
                        <option value="">-- Choose Department --</option>
                        {departments.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    {dept && (
                      <div>
                        <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>
                          <i className="fas fa-user-md" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Select Doctor
                        </label>
                        {availableDoctors.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No doctors in this department currently.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                            {availableDoctors.map(doc => {
                              const inactive = doc.is_active === false;
                              return (
                              <div key={doc.id}
                                onClick={() => !inactive && setSelectedDoctor(doc)}
                                style={{
                                  border: `2px solid ${selectedDoctor?.id === doc.id ? 'var(--teal)' : inactive ? '#FCA5A5' : 'var(--border-color)'}`,
                                  borderRadius: '12px', padding: '0.875rem 1rem',
                                  cursor: inactive ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                                  background: inactive ? 'rgba(239,68,68,0.04)' : selectedDoctor?.id === doc.id ? 'rgba(20,184,166,0.06)' : 'var(--bg-primary)',
                                  transition: 'all 0.2s', opacity: inactive ? 0.75 : 1,
                                }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: inactive ? '#9CA3AF' : 'linear-gradient(135deg, var(--navy), var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                                  {doc.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: inactive ? '#9CA3AF' : 'var(--text-primary)', fontSize: '0.85rem' }}>{doc.name.replace(/^(dr\.|dr)\s+/i, '') ? `Dr. ${doc.name.replace(/^(dr\.|dr)\s+/i, '')}` : doc.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: inactive ? '#9CA3AF' : 'var(--teal)' }}>{doc.specialization} • {doc.experience}y exp</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.timings}</div>
                                  {inactive && (
                                    <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <i className="fas fa-ban" />
                                      Currently inactive — not accepting appointments
                                    </div>
                                  )}
                                </div>
                                {selectedDoctor?.id === doc.id && <i className="fas fa-check-circle" style={{ color: 'var(--teal)', fontSize: '1.25rem' }}></i>}
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <button className="btn-primary" onClick={() => setStep(2)} disabled={!selectedDoctor}
                      style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', opacity: !selectedDoctor ? 0.5 : 1 }}>
                      Next: Select Date & Time <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div>
                    {selectedDoctor && (
                      <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--navy)', flexShrink: 0 }}>
                            {selectedDoctor.photo ? (
                              <img src={selectedDoctor.photo} alt={selectedDoctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>
                                {selectedDoctor.name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.1rem' }}>{selectedDoctor.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>{selectedDoctor.specialization}</p>
                          </div>
                          <button onClick={() => setSelectedDoctor(undefined)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ background: 'white', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Available Days</p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDoctor.available_days}</p>
                          </div>
                          <div style={{ background: 'white', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Doctor Timings</p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDoctor.timings}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calendar */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.3rem 0' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`}></div>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const d = i + 1;
                          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                          const isPast = dateObj < today;
                          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSelected = selectedDate === dateStr;
                          const isToday = dateObj.toDateString() === new Date().toDateString();
                          return (
                            <div key={d} onClick={() => !isPast && handleDateSelect(d)}
                              className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isPast ? 'disabled' : ''}`}>
                              {d}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                      <div>
                        <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span><i className="fas fa-clock" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Available Time Slots</span>
                        </label>

                        {/* Floating Timer */}
                        {timeLeft !== null && (
                          <div style={{ 
                            position: 'fixed', 
                            top: '20px', 
                            left: '20px', 
                            background: '#EF4444', 
                            color: 'white', 
                            padding: '0.6rem 1.25rem', 
                            borderRadius: '50px', 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            zIndex: 9999, 
                            boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
                          }}>
                            <i className="fas fa-stopwatch fa-spin" style={{ animationDuration: '2s' }}></i>
                            <span>Slot reserved: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {loadingSlots ? (
                            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i> Loading slots...
                            </div>
                          ) : doctorOnLeave ? (
                            <div style={{
                              padding: '1.5rem', width: '100%', borderRadius: '12px',
                              background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.25)',
                              display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
                            }}>
                              <i className="fas fa-calendar-times" style={{ color: '#EF4444', fontSize: '1.2rem', marginTop: '0.1rem', flexShrink: 0 }}></i>
                              <div>
                                <p style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                  Dr. {selectedDoctor?.name} is on leave today
                                </p>
                                <p style={{ fontSize: '0.8rem', color: '#EF4444' }}>
                                  No appointments available on this date. Please select a different date.
                                </p>
                              </div>
                            </div>
                          ) : displaySlots.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                              No slots available for this doctor on selected date.
                            </div>
                          ) : (
                            displaySlots.map((slot: any) => {
                              const isBooked = slot.status === 'booked';
                              const isLocked = slot.status === 'locked' && !slot.is_mine;
                              const isMine = slot.is_mine;
                              const isPast = slot.status === 'past';
                              const isDisabled = isBooked || isLocked || isPast;

                              return (
                                <button key={slot.time} disabled={isDisabled}
                                  className={`time-slot ${selectedSlot === slot.time ? 'selected' : ''} ${isDisabled ? 'unavailable' : ''} ${isMine ? 'mine' : ''}`}
                                  style={{
                                    position: 'relative',
                                    ...(isMine ? { border: '2px solid var(--gold)', background: 'rgba(200,169,81,0.1)', color: 'var(--navy)' } : {}),
                                    ...(isLocked ? { opacity: 0.6, background: '#fff3e0' } : {}),
                                    ...(isBooked ? { opacity: 0.6, background: '#ffebee' } : {})
                                  }}
                                  onClick={() => handleSlotSelection(slot.time, !isDisabled)}>
                                  {slot.time}
                                  {isMine && <div style={{ fontSize: '0.55rem', position: 'absolute', top: '-8px', right: '-4px', background: 'var(--gold)', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>MINE</div>}
                                  {isLocked && <div style={{ fontSize: '0.55rem', color: '#e67e22', fontWeight: 600 }}>Locked</div>}
                                  {isBooked && <div style={{ fontSize: '0.55rem', color: '#EF4444', fontWeight: 600 }}>Booked</div>}
                                  {isPast && <div style={{ fontSize: '0.55rem', color: '#95a5a6', fontWeight: 600 }}>Past</div>}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.75rem', border: '1.5px solid var(--border-color)', borderRadius: '50px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '0.35rem' }}></i>Back
                      </button>
                      <button className="btn-primary" onClick={() => setStep(3)} disabled={!selectedDate || !selectedSlot}
                        style={{ flex: 2, justifyContent: 'center', opacity: (!selectedDate || !selectedSlot) ? 0.5 : 1 }}>
                        Next: Patient Details <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div>
                    <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '10px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <strong>Dr. {selectedDoctor?.name}</strong> - {selectedDate} at {selectedSlot}
                    </div>

                    {/* FOLLOW-UP ELIGIBILITY BANNER */}
                    {selectedPatientId && selectedDoctor && (
                      checkingFollowup ? (
                        <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fas fa-spinner fa-spin" style={{ color: 'var(--teal)', fontSize: '0.8rem' }}></i>
                          <span style={{ fontSize: '0.8rem', color: 'var(--teal)' }}>Checking follow-up eligibility...</span>
                        </div>
                      ) : followupInfo?.has_previous_visit ? (
                        <div style={{
                          background: followupInfo.is_free_followup ? 'rgba(22,163,74,0.08)' : followupInfo.is_followup_eligible ? 'rgba(245,158,11,0.08)' : 'rgba(20,184,166,0.06)',
                          border: `1px solid ${followupInfo.is_free_followup ? 'rgba(22,163,74,0.3)' : followupInfo.is_followup_eligible ? 'rgba(245,158,11,0.3)' : 'rgba(20,184,166,0.2)'}`,
                          borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <i className={`fas ${followupInfo.is_free_followup ? 'fa-gift' : followupInfo.is_followup_eligible ? 'fa-clock' : 'fa-history'}`}
                              style={{ color: followupInfo.is_free_followup ? '#16A34A' : followupInfo.is_followup_eligible ? '#F59E0B' : 'var(--teal)', marginTop: '0.1rem', fontSize: '0.9rem' }}></i>
                            <div>
                              {followupInfo.is_free_followup ? (
                                <>
                                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16A34A', marginBottom: '0.2rem' }}>
                                    Free Follow-up Visit
                                  </p>
                                  <p style={{ fontSize: '0.78rem', color: '#16A34A' }}>
                                    Last visit was {followupInfo.days_since_last} day{followupInfo.days_since_last !== 1 ? 's' : ''} ago · {followupInfo.remaining_followups} free follow-up{followupInfo.remaining_followups !== 1 ? 's' : ''} remaining · No charge
                                  </p>
                                </>
                              ) : followupInfo.is_followup_eligible ? (
                                <>
                                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F5A623', marginBottom: '0.2rem' }}>
                                    Follow-up Visit — ₹{followupInfo.followup_fee}
                                  </p>
                                  <p style={{ fontSize: '0.78rem', color: '#F59E0B' }}>
                                    Last visit was {followupInfo.days_since_last} day{followupInfo.days_since_last !== 1 ? 's' : ''} ago · All free follow-ups used ({followupInfo.followup_count}/{followupInfo.max_followup_count})
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--teal)', marginBottom: '0.2rem' }}>
                                    Returning Patient — New Consultation
                                  </p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Last visit was {followupInfo.days_since_last} day{followupInfo.days_since_last !== 1 ? 's' : ''} ago (outside {followupInfo.max_followup_count > 0 ? `${followupInfo.max_followup_count}-visit` : ''} follow-up window) · Consultation fee applies
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}

                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><i className="fas fa-user" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Patient Name *</span>
                      </label>
                      <input value={name} onChange={e => {
                        setName(e.target.value);
                        if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                          resetPatientVerification();
                        }
                      }} placeholder="Enter full name" disabled={isPatientFound} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label><i className="fas fa-phone" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Phone *</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            value={phone} 
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(value);
                              if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                                resetPatientVerification();
                              }
                            }} 
                            placeholder="10-digit mobile" 
                            type="tel" 
                            maxLength={10}
                            disabled={otpVerified}
                            style={{ 
                              borderColor: phone.length > 0 && phone.length !== 10 ? '#EF4444' : undefined,
                              paddingRight: phone.length === 10 && !otpVerified ? '100px' : undefined
                            }}
                          />
                          {phone.length === 10 && !otpVerified && (
                            <button
                              type="button"
                              onClick={handleRequestOTP}
                              disabled={verifyingOTP}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'var(--teal)',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              {verifyingOTP ? <i className="fas fa-spinner fa-spin"></i> : 'Verify'}
                            </button>
                          )}
                        </div>
                        {phone.length > 0 && phone.length !== 10 && (
                          <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: '0.3rem' }}></i>
                            Enter exactly 10 digits ({phone.length}/10)
                          </div>
                        )}
                        {otpVerified && (
                          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: '0.3rem' }}></i>
                            Phone verified
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-envelope" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Email (Optional)</label>
                        <input value={email} onChange={e => {
                          setEmail(e.target.value);
                          if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                            resetPatientVerification();
                          }
                        }} placeholder="email@example.com" type="email" disabled={isPatientFound} />
                      </div>
                    </div>

                    {/* Existing Patient Banner */}
                    {isPatientFound && selectedPatientData && (
                      <div style={{
                        background: 'rgba(22,163,74,0.08)',
                        border: '1px solid rgba(22,163,74,0.3)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <i className="fas fa-user-check" style={{ color: '#16A34A', fontSize: '1.2rem' }}></i>
                          <div>
                            <h4 style={{ color: '#16A34A', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                              Existing Patient Found
                            </h4>
                            <p style={{ color: '#16A34A', fontSize: '0.8rem', margin: 0 }}>
                              Patient ID: {selectedPatientData.id} • All details auto-filled
                            </p>
                          </div>
                          <button
                            onClick={resetPatientVerification}
                            style={{
                              marginLeft: 'auto',
                              background: 'none',
                              border: '1px solid rgba(22,163,74,0.4)',
                              color: '#16A34A',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Change Patient
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New Patient Banner */}
                    {isNewPatient && !isPatientFound && (
                      <div style={{
                        background: 'rgba(20,184,166,0.08)',
                        border: '1px solid rgba(20,184,166,0.3)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <i className="fas fa-user-plus" style={{ color: 'var(--teal)', fontSize: '1.2rem' }}></i>
                          <div>
                            <h4 style={{ color: 'var(--teal)', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                              New Patient Registration
                            </h4>
                            <p style={{ color: 'var(--teal)', fontSize: '0.8rem', margin: 0 }}>
                              Please fill in your details below. A patient ID will be created for you.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Patient Selection for Multiple Patients */}
                    {availablePatients.length > 1 && !selectedPatientData && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>
                          <i className="fas fa-users" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>
                          Select Your Profile
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {availablePatients.map((patient, index) => (
                            <div
                              key={patient.id}
                              onClick={() => handleSelectPatient(patient)}
                              style={{
                                border: '2px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                background: 'var(--bg-primary)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--teal)';
                                e.currentTarget.style.background = 'rgba(20,184,166,0.04)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-primary)';
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {patient.full_name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Age: {patient.age} • Gender: {patient.gender} • ID: {patient.id}
                                </div>
                              </div>
                              <i className="fas fa-chevron-right" style={{ color: 'var(--teal)' }}></i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>
                          <i className="fas fa-birthday-cake" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>
                          Age *
                          {ageAutoCalculated && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: '#16A34A', 
                              marginLeft: '0.5rem',
                              fontWeight: 'normal'
                            }}>
                              <i className="fas fa-magic" style={{ marginRight: '0.25rem' }}></i>
                              Auto-calculated
                            </span>
                          )}
                        </label>
                        <input 
                          value={age} 
                          onChange={e => {
                            setAge(e.target.value);
                            setAgeAutoCalculated(false); // Reset auto-calculated flag when manually edited
                            if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                              setSelectedPatientId(null);
                              setIsPatientFound(false);
                              patientFoundRef.current = false;
                            }
                          }} 
                          placeholder="Age in years" 
                          type="number" 
                          min="0" 
                          max="150"
                          style={{
                            borderColor: ageAutoCalculated ? '#16A34A' : undefined,
                            background: ageAutoCalculated ? 'rgba(22,163,74,0.05)' : undefined
                          }}
                        />
                        {ageAutoCalculated && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#16A34A', 
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <i className="fas fa-check-circle"></i>
                            Calculated from date of birth
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-calendar-alt" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Date of Birth</label>
                        <input value={dob} onChange={e => {
                          const dobValue = e.target.value;
                          setDob(dobValue);
                          
                          // Auto-calculate age from date of birth
                          if (dobValue) {
                            const birthDate = new Date(dobValue);
                            const today = new Date();
                            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            
                            // Adjust age if birthday hasn't occurred this year
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              calculatedAge--;
                            }
                            
                            // Only set age if it's a valid positive number
                            if (calculatedAge >= 0 && calculatedAge <= 150) {
                              setAge(calculatedAge.toString());
                              setAgeAutoCalculated(true);
                            }
                          } else {
                            // Clear age if DOB is cleared
                            if (ageAutoCalculated) {
                              setAge('');
                              setAgeAutoCalculated(false);
                            }
                          }
                          
                          if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                            setSelectedPatientId(null);
                            setIsPatientFound(false);
                            patientFoundRef.current = false;
                          }
                        }} type="date" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label><i className="fas fa-venus-mars" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Gender</label>
                        <select value={gender} onChange={e => {
                          setGender(e.target.value);
                          if (isPatientFound || selectedPatientId || patientFoundRef.current) {
                            setSelectedPatientId(null);
                            setIsPatientFound(false);
                            patientFoundRef.current = false;
                          }
                        }}>
                          <option value="">-- Select --</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-stethoscope" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Visit Type</label>
                        {/* Auto-determined — not user-editable */}
                        <div style={{
                          padding: '0.6rem 0.875rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${visitType === 'follow_up' ? 'rgba(22,163,74,0.4)' : 'rgba(20,184,166,0.3)'}`,
                          background: visitType === 'follow_up' ? 'rgba(22,163,74,0.06)' : 'rgba(20,184,166,0.04)',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          fontSize: '0.9rem', fontWeight: 600,
                          color: visitType === 'follow_up' ? '#16A34A' : 'var(--teal)',
                        }}>
                          <i className={`fas ${visitType === 'follow_up' ? 'fa-redo' : 'fa-stethoscope'}`} style={{ fontSize: '0.8rem' }}></i>
                          {visitType === 'follow_up' ? 'Follow-up' : 'Consultation'}
                          {checkingFollowup && (
                            <i className="fas fa-spinner fa-spin" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--teal)' }}></i>
                          )}
                          {!checkingFollowup && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>
                              {selectedPatientId ? 'Auto-determined' : 'Select patient first'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label><i className="fas fa-map-pin" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Pincode</label>
                        <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="6-digit pincode" maxLength={6} />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-city" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City name" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label><i className="fas fa-map" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>State</label>
                        <input value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State name" />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-home" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Village / Area</label>
                        <input value={village} onChange={e => setVillage(e.target.value)} placeholder="Village name" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label><i className="fas fa-map-marker-alt" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Full Address (Alternative)</label>
                      <input value={address} onChange={e => {
                        setAddress(e.target.value);
                        enterManualMode();
                        if (isPatientFound) {
                          patientFoundRef.current = false;
                          setIsPatientFound(false);
                        }
                      }} placeholder="Enter if other details not provided" />
                    </div>

                    <div className="form-group">
                      <label><i className="fas fa-sticky-note" style={{ marginRight: '0.35rem', color: 'var(--teal)' }}></i>Reason for Visit / Symptoms</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your health concern briefly..." rows={3}></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.75rem', border: '1.5px solid var(--border-color)', borderRadius: '50px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '0.35rem' }}></i>Back
                      </button>
                      <button className="btn-primary" 
                        onClick={isRescheduling ? handleReschedule : handleSubmit} 
                        disabled={submitting || !name || !phone || !age}
                        style={{ flex: 2, justifyContent: 'center', opacity: (submitting || !name || !phone || !age) ? 0.5 : 1 }}>
                        {submitting ? (
                          <><i className="fas fa-spinner fa-spin"></i> {isRescheduling ? 'Rescheduling...' : 'Booking...'}</>
                        ) : (
                          <><i className="fas fa-check-circle"></i> {isRescheduling ? 'Confirm Reschedule' : 'Confirm Appointment'}</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* CONFIRMATION VIEW */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white', fontSize: '2.5rem', boxShadow: '0 10px 20px rgba(22,163,74,0.2)' }}>
                  <i className="fas fa-check"></i>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {isRescheduling ? 'Appointment Rescheduled!' : 'Appointment Confirmed!'}
                </h3>
                <p style={{ opacity: 0.9, marginBottom: '1rem' }}>
                  {isRescheduling 
                    ? 'Your appointment has been successfully updated.' 
                    : 'Your appointment has been successfully scheduled.'}
                </p>
                {isNewPatient && !isRescheduling && (
                  <div style={{ display: 'inline-block', background: 'rgba(20,184,166,0.1)', color: 'var(--teal)', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 600 }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '0.35rem' }}></i> New patient registered automatically
                  </div>
                )}
                {!isRescheduling && <div className="ref-number">{refNumber}</div>}
                
                <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '1.25rem', margin: '1rem 0', textAlign: 'left' }}>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                    </div>
                    {confirmedPatientId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Patient ID:</span>
                        <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{confirmedPatientId}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>
                      <span style={{ fontWeight: 600 }}>{selectedDoctor?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                      <span style={{ fontWeight: 600 }}>{selectedDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Time:</span>
                      <span style={{ fontWeight: 600 }}>{selectedSlot}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                  A confirmation {email ? 'email and ' : ''}SMS will be sent to {phone}.
                </p>
                
                <button className="btn-primary" onClick={resetForm} style={{ width: '100%', justifyContent: 'center' }}>
                  {isRescheduling ? 'Back to Dashboard' : 'Book Another Appointment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPVerification && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white', fontSize: '1.5rem' }}>
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Verify Your Phone</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                We've sent a 6-digit OTP to {maskedPhone}
              </p>
            </div>
            
            <div className="form-group">
              <label>Enter OTP</label>
              <input 
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                type="text"
                maxLength={6}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.2rem', 
                  letterSpacing: '0.5rem',
                  fontWeight: 600
                }}
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => {
                  setShowOTPVerification(false);
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifyOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: (verifyingOTP || otpCode.length !== 6) ? 0.5 : 1 }}
              >
                {verifyingOTP ? (
                  <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                ) : (
                  <><i className="fas fa-check"></i> Verify</>
                )}
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={handleRequestOTP}
                disabled={verifyingOTP}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Resend OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showReasonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--navy)' }}>Reason for Cancellation</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Please tell us why you are cancelling your appointment.</p>
            <textarea 
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => {
                  setShowReasonModal(false);
                  setCancellingId(null);
                  setCancelReason('');
                }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Go Back
              </button>
              <button 
                onClick={handleCancelSubmit}
                disabled={submitting || !cancelReason}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: '#EF4444', borderColor: '#EF4444' }}
              >
                {submitting ? 'Cancelling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
