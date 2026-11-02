import axios from 'axios';

/**
 * Enterprise Axios Instance
 * Supports both HTTP-Only Cookies (via withCredentials: true)
 * and Bearer Token header (dual-strategy for flexibility and security).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Automatically sends and receives HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach token if available in storage as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract standardized server message if present
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';

    // If session expired and not on login page, handle cleanup
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
    }

    return Promise.reject({
      statusCode: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default api;
