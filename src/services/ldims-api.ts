/**
 * LDIMS API Client - Unified backend for all modules
 * Uses `/api/lab` prefix for all endpoints
 */
import axios from 'axios'

const ldims = axios.create({
  // In dev: Vite proxy forwards /api/* → http://localhost:5000/api/lab/*
  // In prod: set VITE_API_BASE_URL env var
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || '/api/lab',
  timeout: 15000,
})

const redirectToLogin = () => {
  if (import.meta.env.MODE === 'test') {
    window.history.replaceState({}, '', '/login')
    return
  }
  window.location.href = '/login'
}

// Add auth token to all requests
ldims.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
ldims.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const errMsg: string = error.response?.data?.error || ''

    // Clear auth and redirect on 401 or JWT errors
    const isJwtError = status === 500 && (
      errMsg.includes('token') || errMsg.includes('expired') || errMsg.includes('signature')
    )

    if (status === 401 || isJwtError) {
      localStorage.removeItem('token')
      localStorage.removeItem('hms_user')
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      redirectToLogin()
    }
    return Promise.reject(error)
  }
)

export default ldims
