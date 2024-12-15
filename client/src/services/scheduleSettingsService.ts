import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export interface WorkingHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ScheduleSettings {
  id: string;
  salonId: string;
  workingHours: WorkingHours[];
  defaultAppointmentDuration: number;
  bufferBetweenAppointments: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  createdAt: string;
  updatedAt: string;
}

export const getScheduleSettings = async (): Promise<ScheduleSettings> => {
  const response = await axios.get(`${API_BASE_URL}/schedule/working-hours`);
  return response.data;
};

export const updateScheduleSettings = async (settings: Partial<ScheduleSettings>): Promise<ScheduleSettings> => {
  const response = await axios.put(`${API_BASE_URL}/schedule/working-hours`, settings);
  return response.data;
};
