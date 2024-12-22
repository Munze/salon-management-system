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
    
    // Convert from new format to old format
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (response.data.workingHours) {
      const oldFormatData = response.data.workingHours.map((hours: any) => ({
        dayOfWeek: days[hours.day],
        startTime: hours.openTime,
        endTime: hours.closeTime,
        isWorkingDay: hours.isOpen,
        id: '', // Add default values for compatibility
        therapistId: therapistId || ''
      }));
      return oldFormatData;
    }
    return response.data;
  },

  updateWorkingHours: async (workingHoursData: CreateWorkingHoursData[]) => {
    try {
      console.log('Input working hours data:', JSON.stringify(workingHoursData, null, 2));
      
      // Validate the data before sending
      if (!Array.isArray(workingHoursData) || workingHoursData.length === 0) {
        throw new Error('Invalid working hours data: must be a non-empty array');
      }

      // Validate each entry
      workingHoursData.forEach((hours, index) => {
        console.log(`Validating entry ${index}:`, hours);
        if (!hours.dayOfWeek || !hours.startTime || !hours.endTime || typeof hours.isWorkingDay !== 'boolean') {
          console.error('Invalid entry:', hours);
          throw new Error('Invalid working hours data: missing required fields');
        }
      });

      // Convert to new format - match the backend's day order
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      console.log('Using days array:', days);
      
      const workingHours = workingHoursData.map((hours, index) => {
        console.log(`Converting entry ${index}:`, hours);
        const dayIndex = days.indexOf(hours.dayOfWeek);
        console.log(`Day index for ${hours.dayOfWeek}:`, dayIndex);
        
        if (dayIndex === -1) {
          console.error(`Invalid day of week: ${hours.dayOfWeek}`);
          throw new Error(`Invalid day of week: ${hours.dayOfWeek}`);
        }
        
        const converted = {
          dayOfWeek: hours.dayOfWeek,
          startTime: hours.startTime,
          endTime: hours.endTime,
          isWorkingDay: hours.isWorkingDay,
          therapistId: hours.therapistId
        };
        console.log(`Converted entry ${index}:`, converted);
        return converted;
      });
      
      // Sort by day to ensure consistent order
      workingHours.sort((a, b) => days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek));
      
      console.log('Final working hours data to send:', workingHours);
      const response = await axios.put(`${API_BASE_URL}/schedule/working-hours`, workingHours);
      console.log('Working hours update response:', response.data);
      
      // Return the settings from the response
      if (response.data.settings) {
        return response.data.settings;
      }
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
