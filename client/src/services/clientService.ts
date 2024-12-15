import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';
import authService from './authService';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface WorkingHours {
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string;
  endTime: string;
}

const clientService = {
  getAllClients: async () => {
    console.log('Fetching all clients...');
    const response = await axios.get('/clients');
    console.log('Client response:', response.data);
    return response.data.map(client => ({
      ...client,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt)
    }));
  },

  getClient: async (id: string) => {
    const response = await axios.get(`/clients/${id}`);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  createClient: async (clientData: CreateClientData) => {
    const response = await axios.post('/clients', clientData);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  updateClient: async (id: string, clientData: Partial<CreateClientData>) => {
    const response = await axios.put(`/clients/${id}`, clientData);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  deleteClient: async (id: string) => {
    await axios.delete(`/clients/${id}`);
  },

  getClientHistory: async (id: string, timeframe: string = 'thisMonth') => {
    console.log('Fetching client history:', { id, timeframe });
    const response = await axios.get(`/clients/${id}/history`, {
      params: { timeframe }
    });
    console.log('Client history response:', response.data);
    return response.data;
  }
};

export default clientService;
