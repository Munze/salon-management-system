import axios from '../config/axiosConfig';
import { API_BASE_URL } from '../config/apiConfig';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkingHours {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isWorkingDay: boolean;
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
  getWorkingHours: async () => {
    const response = await axios.get(`${API_BASE_URL}/schedule/working-hours`);
    return response.data;
  },

  updateWorkingHours: async (workingHoursData: CreateWorkingHoursData[]) => {
    const response = await axios.put(`${API_BASE_URL}/schedule/working-hours`, workingHoursData);
    return response.data;
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
  checkAvailability: async (startTime: string, endTime: string, therapistId?: string, excludeId?: string): Promise<AvailabilityResponse> => {
    try {
      // Convert local time to UTC before sending to server
      const startLocal = new Date(startTime);
      const endLocal = new Date(endTime);
      
      // Belgrade is UTC+1, so subtract 1 hour to get UTC
      const startUtc = new Date(startLocal.getTime() - 60 * 60 * 1000);
      const endUtc = new Date(endLocal.getTime() - 60 * 60 * 1000);

      const response = await axios.get(`${API_BASE_URL}/appointments/check-availability`, {
        params: {
          startTime: startUtc.toISOString(),
          endTime: endUtc.toISOString(),
          therapistId,
          excludeId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
};

export default scheduleService;
