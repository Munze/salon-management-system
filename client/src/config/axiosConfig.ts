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

// Variable to track if a token refresh is in progress
let isRefreshing = false;
// Store callbacks of requests that are waiting for the token refresh
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to process the queue of requests
const processQueue = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

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

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Try to refresh the token
          await authService.refreshToken();
          
          // Get the new token
          const token = authService.getAccessToken();
          if (!token) throw new Error('No token after refresh');

          // Update the request header
          originalRequest.headers['Authorization'] = `Bearer ${token}`;

          // Process the queue of requests
          processQueue(token);

          // Return the original request with the new token
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, logout the user
          authService.logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If a refresh is already in progress, add this request to the queue
        return new Promise(resolve => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
    }

    // Log the error for debugging
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
