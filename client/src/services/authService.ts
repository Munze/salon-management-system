import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';
import { User } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const authService = {
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Attempting login with:', { email: credentials.email, rememberMe: credentials.rememberMe });
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);
      console.log('Login response:', response.data);
      const { accessToken, refreshToken, user } = response.data;
      authService.setTokens(accessToken, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, data);
      const { accessToken, refreshToken, user } = response.data;
      authService.setTokens(accessToken, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email: string) => {
    return axios.post(`${API_BASE_URL}/auth/request-reset`, { email });
  },

  resetPassword: async (data: ResetPasswordData) => {
    return axios.post(`${API_BASE_URL}/auth/reset-password`, data);
  },

  refreshToken: async () => {
    try {
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      authService.setTokens(accessToken, newRefreshToken);
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      authService.clearTokens();
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr) {
        return null;
      }

      const user = JSON.parse(userStr) as User;
      const response = await axios.get<User>(`${API_BASE_URL}/auth/me`);
      const updatedUser = response.data;
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Get current user error:', error);
      authService.clearTokens();
      return null;
    }
  },

  logout: () => {
    authService.clearTokens();
    window.location.href = '/login';
  },
};

export default authService;
