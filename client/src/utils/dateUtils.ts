import { WorkingHours } from '../services/clientService';

export function isWithinWorkingHours(
  startTime: Date,
  endTime: Date,
  workingHours: WorkingHours[]
): boolean {
  // Get the day of week for the appointment
  const dayOfWeek = startTime.getDay();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const appointmentDay = dayNames[dayOfWeek];

  // Find working hours for this day of week
  const dayWorkingHours = workingHours.find(wh => wh.dayOfWeek === appointmentDay);

  console.log('Checking working hours:', {
    appointmentDay,
    startTime,
    endTime,
    dayWorkingHours
  });

  if (!dayWorkingHours || !dayWorkingHours.isWorkingDay) {
    console.log('Not a working day');
    return false;
  }

  // Convert working hours to today's date for comparison
  const [workStartHour, workStartMinute] = dayWorkingHours.startTime.split(':').map(Number);
  const [workEndHour, workEndMinute] = dayWorkingHours.endTime.split(':').map(Number);

  const workingStartTime = new Date(startTime);
  workingStartTime.setHours(workStartHour, workStartMinute, 0);

  const workingEndTime = new Date(startTime);
  workingEndTime.setHours(workEndHour, workEndMinute, 0);

  console.log('Time comparison:', {
    appointmentStart: startTime,
    appointmentEnd: endTime,
    workingStart: workingStartTime,
    workingEnd: workingEndTime
  });

  // Check if appointment time is within working hours
  return startTime >= workingStartTime && endTime <= workingEndTime;
}

export function roundToNextQuarter(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  const result = new Date(date);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  // If we rounded up to the next hour
  if (roundedMinutes === 60) {
    result.setMinutes(0);
    result.setHours(result.getHours() + 1);
  }
  
  return result;
}
