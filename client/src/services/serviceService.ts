import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface CreateServiceData {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  isActive?: boolean;
}

const serviceService = {
  getAllServices: async () => {
    const response = await axios.get('/services');
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await axios.get(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData: CreateServiceData) => {
    const response = await axios.post('/services', serviceData);
    return response.data;
  },

  updateService: async (id: string, serviceData: UpdateServiceData) => {
    const response = await axios.put(`/services/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id: string) => {
    await axios.delete(`/services/${id}`);
  }
};

export default serviceService;
