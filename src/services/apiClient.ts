import axios from 'axios';

// Always use the real backend — DATABASE_URL points to postgresql://hmsuser@100.99.12.2:5432/hms_local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

// Response interceptor — handle auth expiry and log errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    if (error.code === 'ECONNABORTED') {
      console.error('[HMS] Request timeout — is the backend running on port 5000?');
    }
    if (!error.response) {
      console.error('[HMS] Network error — backend unreachable at', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);

export default apiClient;