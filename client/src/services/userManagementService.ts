import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';
import { User } from '../types/user';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'THERAPIST';
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'THERAPIST';
  password?: string;
}

const userManagementService = {
  getUsers: async (search?: string): Promise<User[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { search },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  },

  createUser: async (userData: CreateUserData): Promise<User> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  },

  updateUser: async (userId: string, userData: UpdateUserData): Promise<User> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }
};

export default userManagementService;
