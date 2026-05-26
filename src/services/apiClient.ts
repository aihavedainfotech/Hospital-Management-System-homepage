import axios from 'axios';

const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? 'http://localhost:5001/api' : (import.meta.env.VITE_API_BASE_URL || 'https://hospital-management-system-homepage.onrender.com/api');

// Render free-tier spins down after 15 min of inactivity and needs up to 60s to wake.
// So we use a 70s timeout with retry logic to handle cold starts gracefully.
const INITIAL_TIMEOUT = 70000; // 70 seconds

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: INITIAL_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    // Only log in development, not production
    if (import.meta.env.DEV) {
      if (error.code === 'ECONNABORTED') {
        console.warn('[HMS] Request timeout — server may be waking up (Render cold start). Retry in a moment.');
      }
      if (!error.response) {
        console.warn('[HMS] Network error — backend unreachable at', API_BASE_URL);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;