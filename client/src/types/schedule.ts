import { DayOfWeek } from '../services/scheduleService';

export interface WorkingHours {
  id?: string;
  therapistId?: string;
  dayOfWeek: number | DayOfWeek; // Allow both number and DayOfWeek type
  startTime: string;
  endTime: string;
  isWorkingDay?: boolean;
}
