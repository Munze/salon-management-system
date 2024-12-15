import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  createdAt?: Date;
  updatedAt?: Date;
  generatedPassword?: string; // For newly created therapists
}

export type CreateTherapistData = Omit<Therapist, 'id' | 'createdAt' | 'updatedAt' | 'generatedPassword'>;

const therapistService = {
  getTherapists: async (): Promise<Therapist[]> => {
    const response = await axios.get(`${API_BASE_URL}/therapists`);
    return response.data.map((therapist: any) => ({
      ...therapist,
      specialties: therapist.specialties || [],
      createdAt: therapist.createdAt ? new Date(therapist.createdAt) : undefined,
      updatedAt: therapist.updatedAt ? new Date(therapist.updatedAt) : undefined,
    }));
  },

  getTherapist: async (id: string): Promise<Therapist> => {
    const response = await axios.get(`${API_BASE_URL}/therapists/${id}`);
    return {
      ...response.data,
      specialties: response.data.specialties || [],
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
    };
  },

  createTherapist: async (data: CreateTherapistData): Promise<Therapist> => {
    const response = await axios.post(`${API_BASE_URL}/therapists`, data);
    return {
      ...response.data,
      specialties: response.data.specialties || [],
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
    };
  },

  updateTherapist: async (id: string, data: Partial<Therapist>): Promise<Therapist> => {
    const response = await axios.put(`${API_BASE_URL}/therapists/${id}`, data);
    return {
      ...response.data,
      specialties: response.data.specialties || [],
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
    };
  },

  deleteTherapist: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/therapists/${id}`);
  }
};

export default therapistService;
