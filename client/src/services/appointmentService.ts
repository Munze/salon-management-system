import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  clientId: string;
  therapistId: string;
  serviceId: string;
  cancellationReason?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  therapist?: {
    id: string;
    name: string;
    email: string;
    specialties: string[];
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentData {
  startTime: Date;
  endTime: Date;
  clientId: string;
  therapistId: string;
  serviceId: string;
  notes?: string;
  price: number;
}

export interface UpdateAppointmentData {
  startTime?: Date;
  endTime?: Date;
  status?: string;
  cancellationReason?: string;
  notes?: string;
  clientId?: string;
  therapistId?: string;
  serviceId?: string;
  price?: number;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  therapistId?: string;
  status?: string[];
}

const appointmentService = {
  getAllAppointments: async (filters?: AppointmentFilters) => {
    try {
      let url = `${API_BASE_URL}/appointments`;
      const response = await axios.get(url, { params: filters });
      const appointments = response.data.map(appt => ({
        ...appt,
        startTime: new Date(appt.startTime),
        endTime: new Date(appt.endTime),
        createdAt: new Date(appt.createdAt),
        updatedAt: new Date(appt.updatedAt)
      }));
      return appointments;
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  getUpcomingAppointments: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/appointments/upcoming`);
      const appointments = response.data.map(appt => ({
        ...appt,
        startTime: new Date(appt.startTime),
        endTime: new Date(appt.endTime),
        createdAt: new Date(appt.createdAt),
        updatedAt: new Date(appt.updatedAt)
      }));
      return appointments;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  getAppointmentById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/appointments/${id}`);
    const appt = response.data;
    return {
      ...appt,
      startTime: new Date(appt.startTime),
      endTime: new Date(appt.endTime),
      createdAt: new Date(appt.createdAt),
      updatedAt: new Date(appt.updatedAt)
    };
  },

  createAppointment: async (appointmentData: CreateAppointmentData) => {
    const response = await axios.post(`${API_BASE_URL}/appointments`, {
      ...appointmentData,
      startTime: appointmentData.startTime.toISOString(),
      endTime: appointmentData.endTime.toISOString(),
    });
    const appt = response.data;
    return {
      ...appt,
      startTime: new Date(appt.startTime),
      endTime: new Date(appt.endTime),
      createdAt: new Date(appt.createdAt),
      updatedAt: new Date(appt.updatedAt)
    };
  },

  updateAppointment: async (id: string, appointmentData: UpdateAppointmentData) => {
    try {
      console.log('AppointmentService - Updating appointment:', { id, appointmentData });
      const response = await axios.put(`${API_BASE_URL}/appointments/${id}`, appointmentData);
      console.log('AppointmentService - Update response:', response.data);
      const appt = response.data;
      return {
        ...appt,
        startTime: new Date(appt.startTime),
        endTime: new Date(appt.endTime),
        createdAt: new Date(appt.createdAt),
        updatedAt: new Date(appt.updatedAt)
      };
    } catch (error: any) {
      console.error('AppointmentService - Error updating appointment:', error);
      console.error('AppointmentService - Error details:', error.response?.data);
      throw error;
    }
  },

  deleteAppointment: async (id: string) => {
    await axios.delete(`${API_BASE_URL}/appointments/${id}`);
  },

  confirmAppointment: async (id: string) => {
    return await appointmentService.updateAppointment(id, {
      status: 'CONFIRMED',
    });
  },

  cancelAppointment: async (id: string, reason: string) => {
    return await appointmentService.updateAppointment(id, {
      status: 'CANCELLED',
      cancellationReason: reason,
    });
  },

  markAsCompleted: async (id: string) => {
    return await appointmentService.updateAppointment(id, {
      status: 'COMPLETED',
    });
  },

  markAsNoShow: async (id: string) => {
    return await appointmentService.updateAppointment(id, {
      status: 'NO_SHOW',
    });
  },

  getAvailableSlots: async (
    therapistId: string,
    date: string,
    duration: number
  ) => {
    const response = await axios.get(`${API_BASE_URL}/appointments/available-slots`, {
      params: { therapistId, date, duration },
    });
    return response.data.map(slot => new Date(slot));
  },

  checkAvailability: async (
    therapistId: string,
    startTime: Date,
    endTime: Date
  ) => {
    const response = await axios.get(`${API_BASE_URL}/appointments/check-availability`, {
      params: { 
        therapistId, 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString() 
      },
    });
    return response.data;
  },
};

export default appointmentService;
