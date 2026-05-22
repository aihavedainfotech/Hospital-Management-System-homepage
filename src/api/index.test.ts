import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../services/apiClient'
import {
  bookAppointment,
  cancelAppointmentRequest,
  fetchActiveDepartments,
  fetchDoctors,
  fetchSlots,
  lockSlot,
  rescheduleAppointment,
  searchAppointments,
  submitComplaint,
  unlockSlot,
} from './index'

vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const mockedClient = vi.mocked(apiClient)

describe('homepage API module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches doctors and normalizes success/failure response shapes', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'Dr A' }] } })
    mockedClient.get.mockRejectedValueOnce(new Error('network down'))

    await expect(fetchDoctors({ department: 'cardiology' })).resolves.toEqual({
      data: [{ id: 1, name: 'Dr A' }],
      success: true,
    })
    await expect(fetchDoctors()).resolves.toEqual({ data: [], success: false })
    expect(mockedClient.get).toHaveBeenNthCalledWith(1, '/homepage/doctors', {
      params: { department: 'cardiology' },
    })
  })

  it('unwraps active departments and slot data from API responses', async () => {
    mockedClient.get
      .mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'Cardiology' }] } })
      .mockResolvedValueOnce({ data: { data: [{ time: '10:00', available: true }] } })

    await expect(fetchActiveDepartments()).resolves.toEqual([{ id: 1, name: 'Cardiology' }])
    await expect(fetchSlots(7, '2026-04-07', 'lock-1')).resolves.toEqual([
      { time: '10:00', available: true },
    ])

    expect(mockedClient.get).toHaveBeenNthCalledWith(2, '/homepage/doctors/7/slots', {
      params: { date: '2026-04-07', lock_token: 'lock-1' },
    })
  })

  it('posts appointment, slot-lock, feedback, cancellation, and reschedule payloads', async () => {
    mockedClient.post.mockResolvedValue({ data: { success: true } })
    mockedClient.put.mockResolvedValue({ data: { success: true } })
    mockedClient.get.mockResolvedValue({ data: { success: true } })

    await lockSlot(1, '2026-04-07', '10:00', 'lock-1')
    await unlockSlot('lock-1')
    await bookAppointment({ patient_name: 'Patient A' })
    await submitComplaint({ message: 'Need help' })
    await cancelAppointmentRequest('APT-1', 'not available')
    await rescheduleAppointment('APT-1', '2026-04-08', '11:00', 'lock-2')
    await searchAppointments('9999999999', '2026-04-07')

    expect(mockedClient.post).toHaveBeenCalledWith('/homepage/doctors/slots/lock', {
      doctor_id: 1,
      date: '2026-04-07',
      time: '10:00',
      lock_token: 'lock-1',
    })
    expect(mockedClient.post).toHaveBeenCalledWith('/homepage/doctors/slots/unlock', { lock_token: 'lock-1' })
    expect(mockedClient.post).toHaveBeenCalledWith('/homepage/appointments', { patient_name: 'Patient A' })
    expect(mockedClient.post).toHaveBeenCalledWith('/homepage/complaints', { message: 'Need help' })
    expect(mockedClient.post).toHaveBeenCalledWith('/homepage/cancellations/cancel', {
      id: 'APT-1',
      reason: 'not available',
    })
    expect(mockedClient.put).toHaveBeenCalledWith('/homepage/appointments/reschedule', {
      id: 'APT-1',
      date: '2026-04-08',
      time: '11:00',
      lock_token: 'lock-2',
    })
    expect(mockedClient.get).toHaveBeenCalledWith('/homepage/appointments/search', {
      params: { phone: '9999999999', date: '2026-04-07' },
    })
  })
})
