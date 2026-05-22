/**
 * HMS extended modules service — uses the shared apiClient (/api proxy → :5000)
 */
import axios from 'axios'

// Dedicated HMS client with longer timeout for remote Supabase DB
const hmsClient = axios.create({
  baseURL: '/api/hms',
  timeout: 30000,
})
hmsClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const d = (res: any) => res.data?.data ?? res.data

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  stats:            () => hmsClient.get('/dashboard/stats').then(d),
  revenue:          () => hmsClient.get('/dashboard/revenue').then(d),
  admissionsTrend:  () => hmsClient.get('/dashboard/admissions-trend').then(d),
  wardOccupancy:    () => hmsClient.get('/dashboard/ward-occupancy').then(d),
  recentAdmissions: () => hmsClient.get('/dashboard/recent-admissions').then(d),
  paymentBreakdown: () => hmsClient.get('/dashboard/payment-breakdown').then(d),
  topDoctors:       () => hmsClient.get('/dashboard/top-doctors').then(d),
}

// ── MASTER ────────────────────────────────────────────────────────────────────
export const masterService = {
  getWards:    ()        => hmsClient.get('/master/wards').then(d),
  createWard:  (b: any)  => hmsClient.post('/master/wards', b).then(d),
  updateWard:  (id: number, b: any) => hmsClient.put(`/master/wards/${id}`, b).then(d),
  deleteWard:  (id: number) => hmsClient.delete(`/master/wards/${id}`).then(d),

  getRooms:    (wardId?: number) => hmsClient.get('/master/rooms', { params: wardId ? { ward_id: wardId } : {} }).then(d),
  createRoom:  (b: any)  => hmsClient.post('/master/rooms', b).then(d),
  updateRoom:  (id: number, b: any) => hmsClient.put(`/master/rooms/${id}`, b).then(d),
  deleteRoom:  (id: number) => hmsClient.delete(`/master/rooms/${id}`).then(d),
  getRoomOccupants: (rid: number) => hmsClient.get(`/master/rooms/${rid}/occupants`).then(d),

  getBeds:     (params?: any) => hmsClient.get('/master/beds', { params }).then(d),
  createBed:   (b: any)  => hmsClient.post('/master/beds', b).then(d),
  updateBed:   (id: number, b: any) => hmsClient.put(`/master/beds/${id}`, b).then(d),
  deleteBed:   (id: number) => hmsClient.delete(`/master/beds/${id}`).then(d),

  getPricing:    ()        => hmsClient.get('/master/pricing').then(d),
  createPricing: (b: any)  => hmsClient.post('/master/pricing', b).then(d),
  updatePricing: (id: number, b: any) => hmsClient.put(`/master/pricing/${id}`, b).then(d),
  deletePricing: (id: number) => hmsClient.delete(`/master/pricing/${id}`).then(d),

  getPatients:   (q?: string) => hmsClient.get('/master/patients', { params: q ? { q } : {} }).then(d),
  getPatient:    (uhid: string) => hmsClient.get(`/master/patients/${uhid}`).then(d),
  createPatient: (b: any) => hmsClient.post('/master/patients', b).then(d),
  updatePatient: (uhid: string, b: any) => hmsClient.put(`/master/patients/${uhid}`, b).then(d),

  getDoctors:    ()        => hmsClient.get('/master/doctors').then(d),
  createDoctor:  (b: any)  => hmsClient.post('/master/doctors', b).then(d),
  updateDoctor:  (id: number, b: any) => hmsClient.put(`/master/doctors/${id}`, b).then(d),
  deleteDoctor:  (id: number) => hmsClient.delete(`/master/doctors/${id}`).then(d),
}

// ── ADMISSION ─────────────────────────────────────────────────────────────────
export const admissionService = {
  list:       (params?: any) => hmsClient.get('/admission', { params }).then(d),
  get:        (id: number)   => hmsClient.get(`/admission/${id}`).then(d),
  create:     (b: any)       => hmsClient.post('/admission', b).then(d),
  update:     (id: number, b: any) => hmsClient.put(`/admission/${id}`, b).then(d),
  discharge:  (id: number, b: any) => hmsClient.post(`/admission/${id}/discharge`, b).then(d),
  getCharges: (id: number)   => hmsClient.get(`/admission/${id}/charges`).then(d),
  addCharge:  (id: number, b: any) => hmsClient.post(`/admission/${id}/charges`, b).then(d),
  deleteCharge: (cid: number) => hmsClient.delete(`/admission/charges/${cid}`).then(d),
}

// ── BILLING ───────────────────────────────────────────────────────────────────
export const billingService = {
  list:           (params?: any) => hmsClient.get('/billing', { params }).then(d),
  get:            (id: number)   => hmsClient.get(`/billing/${id}`).then(d),
  generate:       (b: any)       => hmsClient.post('/billing/generate', b).then(d),
  updatePayment:  (id: number, b: any) => hmsClient.post(`/billing/${id}/payment`, b).then(d),
  patientHistory: (pid: number)  => hmsClient.get(`/billing/patient/${pid}`).then(d),
}
