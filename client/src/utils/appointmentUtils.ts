import { WorkingHours } from '../types/schedule';
import { Appointment } from '../types/appointment';
import { format, isWithinInterval, areIntervalsOverlapping } from 'date-fns';

export function isWithinWorkingHours(
  startTime: Date,
  endTime: Date,
  workingHours: WorkingHours
): boolean {
  const dayOfWeek = format(startTime, 'EEEE').toUpperCase();

  if (workingHours.dayOfWeek !== dayOfWeek) {
    return false;
  }

  const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

  const workStart = new Date(startTime);
  workStart.setHours(startHour, startMinute, 0);

  const workEnd = new Date(startTime);
  workEnd.setHours(endHour, endMinute, 0);

  return (
    isWithinInterval(startTime, { start: workStart, end: workEnd }) &&
    isWithinInterval(endTime, { start: workStart, end: workEnd })
  );
}

export function doesOverlapWithExistingAppointments(
  startTime: Date,
  endTime: Date,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): boolean {
  const appointmentInterval = { start: startTime, end: endTime };

  return existingAppointments.some(
    (appointment) =>
      appointment.id !== excludeAppointmentId &&
      areIntervalsOverlapping(appointmentInterval, {
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime),
      })
  );
}
