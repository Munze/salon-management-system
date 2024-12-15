import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkingHours {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isWorkingDay: boolean;
  therapistId?: string;
}

export interface ScheduleException {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
  note?: string;
  therapistId?: string;
}

export interface CreateWorkingHoursData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  therapistId?: string;
}

export interface CreateScheduleExceptionData {
  date: string;
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
  note?: string;
  therapistId?: string;
}

interface AvailabilityResponse {
  available: boolean;
  reason?: 'outside_working_hours' | 'overlap';
  message?: string;
}

const scheduleService = {
  // Working Hours
  getWorkingHours: async (therapistId?: string) => {
    const response = await axios.get(`${API_BASE_URL}/schedule/working-hours`, {
      params: therapistId ? { therapistId } : undefined
    });
    return response.data;
  },

  updateWorkingHours: async (workingHoursData: CreateWorkingHoursData[]) => {
    try {
      console.log('Sending working hours update:', JSON.stringify(workingHoursData, null, 2));
      const response = await axios.put(`${API_BASE_URL}/schedule/working-hours`, workingHoursData);
      console.log('Working hours update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating working hours:', error);
      throw error;
    }
  },

  // Schedule Exceptions
  getScheduleExceptions: async (startDate: string, endDate: string, therapistId?: string) => {
    const response = await axios.get(`${API_BASE_URL}/schedule/exceptions`, {
      params: {
        startDate,
        endDate,
        ...(therapistId && { therapistId })
      }
    });
    return response.data;
  },

  createScheduleException: async (exceptionData: CreateScheduleExceptionData) => {
    const response = await axios.post(`${API_BASE_URL}/schedule/exceptions`, exceptionData);
    return response.data;
  },

  updateScheduleException: async (id: string, exceptionData: Partial<CreateScheduleExceptionData>) => {
    const response = await axios.put(`${API_BASE_URL}/schedule/exceptions/${id}`, exceptionData);
    return response.data;
  },

  deleteScheduleException: async (id: string) => {
    await axios.delete(`${API_BASE_URL}/schedule/exceptions/${id}`);
  },

  // Availability
  checkAvailability: async (startTime: string, endTime: string, therapistId?: string): Promise<AvailabilityResponse> => {
    try {
      console.log('Checking availability:', { startTime, endTime, therapistId });
      const response = await axios.post(`${API_BASE_URL}/schedule/check-availability`, {
        startTime,
        endTime,
        ...(therapistId && { therapistId })
      });
      console.log('Availability response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
};

export default scheduleService;
