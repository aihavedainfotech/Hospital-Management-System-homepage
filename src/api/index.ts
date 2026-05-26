import apiClient from '../services/apiClient';

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  department: string;
  experience: number;
  photo?: string;
  available_days: string;
  timings: string;
  rating: number;
  qualification?: string;
  is_active?: boolean;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  icon?: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Slot {
  time: string;
  available: boolean;
  status: 'available' | 'booked' | 'locked' | 'past';
  is_mine?: boolean;
}

export interface Appointment {
  id: number;
  doctor_name: string;
  department: string;
  date: string;
  time: string;
  status: string;
  patient_name: string;
  patient_phone: string;
  reference?: string;
}

export interface EventNews {
  id: number;
  title: string;
  description: string;
  datetime: string;
  category: 'Event' | 'News' | 'Achievement';
  image?: string;
}

export interface Achievement {
  id: number;
  title: string;
  value: string;
  icon?: string;
}

export interface Report {
  id: number;
  title: string;
  date: string;
  doctor_name: string;
  type: string;
  file_url?: string;
}

export interface Prescription {
  id: string | number;
  doctor_name: string;
  date: string;
  medications: string;
  dosage: string;
  instructions: string;
  diagnosis?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  status?: string;
  notes?: string;
}

export interface LabOrder {
  id: string | number;
  test_name: string;
  doctor_name: string;
  department: string;
  status: string;
  order_date: string;
  result?: string;
  file_url?: string;
  payment_status?: string;
  amount?: number;
}

// All homepage routes are under /api/homepage/* on the unified backend
const HP = '/homepage';

export const fetchDoctors = (params?: Record<string, string>) =>
  apiClient.get(`${HP}/doctors`, { params }).then(r => {
    const rawData = r.data.data || r.data;
    return { data: Array.isArray(rawData) ? rawData : [], success: true };
  }).catch(() => ({ data: [], success: false }));

export const fetchServices = () =>
  apiClient.get(`${HP}/services`).then(r => {
    console.log('fetchServices response:', r.data);
    return Array.isArray(r.data) ? r.data : [];
  }).catch((err) => {
    console.error('fetchServices error:', err);
    return [];
  });

export const fetchDepartments = () =>
  apiClient.get(`${HP}/departments`).then(r => r.data.data || r.data);

export const fetchActiveDepartments = () =>
  apiClient.get(`${HP}/departments`).then(r => r.data.data || r.data);

export const fetchSlots = (doctorId: string | number, date: string, lockToken?: string) =>
  apiClient.get(`${HP}/doctors/${doctorId}/slots`, { params: { date, lock_token: lockToken } })
    .then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? []))
    .catch(() => []);

export const lockSlot = (doctorId: string | number, date: string, time: string, lockToken: string) =>
  apiClient.post(`${HP}/doctors/slots/lock`, { doctor_id: doctorId, date, time, lock_token: lockToken }).then(r => r.data);

export const unlockSlot = (lockToken: string) =>
  apiClient.post(`${HP}/doctors/slots/unlock`, { lock_token: lockToken }).then(r => r.data);

export const bookAppointment = (data: Record<string, unknown>) =>
  apiClient.post(`${HP}/appointments`, data).then(r => r.data);

export const patientLogin = (phone: string) =>
  apiClient.post(`${HP}/patients/login`, { phone }).then(r => r.data);

export const fetchPatientReports = (phone: string) =>
  apiClient.get(`${HP}/patients/${phone}/reports`).then(r => r.data);

export const fetchPatientAppointments = (phone: string) =>
  apiClient.get(`${HP}/patients/${phone}/appointments`).then(r => r.data);

export const fetchPatientPrescriptions = (phone: string) =>
  apiClient.get(`${HP}/patients/${phone}/prescriptions`).then(r => r.data);

export const fetchPatientLabOrders = (patientId: string) =>
  apiClient.get(`/patient/${patientId}/lab_orders`).then(r => r.data);

export const fetchEvents = () =>
  apiClient.get(`${HP}/events`).then(r => r.data.data || r.data).catch(() => []);

export const fetchAchievements = () =>
  apiClient.get(`${HP}/achievements`).then(r => r.data.data || r.data).catch(() => []);

export const fetchTicker = () =>
  apiClient.get(`${HP}/events/ticker`).then(r => r.data.data || r.data).catch(() => []);

export const submitComplaint = (data: any) =>
  apiClient.post(`${HP}/complaints`, data).then(r => r.data);

export const submitSuggestion = (data: any) =>
  apiClient.post(`${HP}/suggestions`, data).then(r => r.data);

export const submitCompliment = (data: any) =>
  apiClient.post(`${HP}/compliments`, data).then(r => r.data);

export const fetchCompliments = () =>
  apiClient.get(`${HP}/complaints`, { params: { type: 'compliment' } })
    .then(r => {
      const data = r.data.data || r.data;
      if (!Array.isArray(data)) return [];
      // Map backend fields to frontend expectations (e.g. message -> feedback)
      return data.map((item: any) => ({
        id: item.id,
        name: item.name || 'Anonymous Patient',
        feedback: item.message || item.feedback || '',
        created_at: item.created_at,
        rating: 5
      }));
    })
    .catch(() => []);

export const searchAppointments = (phone: string, date: string) =>
  apiClient.get(`${HP}/appointments/search`, { params: { phone, date } }).then(r => r.data);

export const cancelAppointmentRequest = (id: string, reason: string) =>
  apiClient.post(`${HP}/cancellations/cancel`, { id, reason }).then(r => r.data);

export const rescheduleAppointment = (id: string | number, date: string, time: string, lockToken?: string) =>
  apiClient.put(`${HP}/appointments/reschedule`, { id, date, time, lock_token: lockToken }).then(r => r.data);

export const searchPatient = (query: string) =>
  apiClient.get(`${HP}/patients/search`, { params: { q: query } }).then(r => r.data);

export const requestPatientOTP = (phone: string) =>
  apiClient.post(`${HP}/patients/login`, { login_type: 'phone', identifier: phone }).then(r => r.data);

export const verifyPatientOTP = (phone: string, otp: string) =>
  apiClient.post(`${HP}/patients/verify-otp`, { identifier: phone, otp }).then(r => r.data);

export const getPatientsByPhone = (phone: string) =>
  apiClient.get(`${HP}/patients/by-phone/${phone}`).then(r => r.data);

export default apiClient;
