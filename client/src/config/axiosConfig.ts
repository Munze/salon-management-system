import axios from 'axios';
import authService from '../services/authService';
import { API_BASE_URL } from './apiConfig';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await authService.refreshToken();
        
        // Get the new token and retry the request
        const token = authService.getAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, logout the user
        authService.logout();
        return Promise.reject(refreshError);
      }
    }

    // Log the error for debugging
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
