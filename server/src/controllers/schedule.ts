import { Request, Response } from 'express';
import prisma from '../prisma';
import { logger } from '../utils/logger';

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

// Working Hours Management
export const getWorkingHours = async (req: Request, res: Response) => {
  try {
    const workingHours = await prisma.scheduleSettings.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    res.json(workingHours);
  } catch (error) {
    logger.error('Error fetching working hours:', error);
    res.status(500).json({ message: 'Failed to fetch working hours' });
  }
};

export const updateWorkingHours = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startTime, endTime, isWorkingDay } = req.body;

  try {
    const updatedHours = await prisma.scheduleSettings.update({
      where: { id },
      data: {
        startTime,
        endTime,
        isWorkingDay
      }
    });

    res.json(updatedHours);
  } catch (error) {
    logger.error('Error updating working hours:', error);
    res.status(500).json({ message: 'Failed to update working hours' });
  }
};

export const updateAllWorkingHours = async (req: Request, res: Response) => {
  const workingHours = req.body;
  
  try {
    // Convert object to array if necessary
    const hoursArray = Array.isArray(workingHours) ? workingHours : Object.values(workingHours);

    // Delete all existing working hours
    await prisma.scheduleSettings.deleteMany({});

    // Create new working hours
    const createdHours = await prisma.scheduleSettings.createMany({
      data: hoursArray.map(hour => ({
        dayOfWeek: hour.dayOfWeek,
        startTime: hour.startTime,
        endTime: hour.endTime,
        isWorkingDay: hour.isWorkingDay
      }))
    });

    // Fetch and return the newly created working hours
    const newWorkingHours = await prisma.scheduleSettings.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    res.json(newWorkingHours);
  } catch (error) {
    logger.error('Error updating all working hours:', error);
    res.status(500).json({ message: 'Failed to update working hours' });
  }
};

export const createWorkingHours = async (req: Request, res: Response) => {
  const { dayOfWeek, startTime, endTime, isWorkingDay } = req.body;

  try {
    // Check if settings already exist for this day
    const existingSettings = await prisma.scheduleSettings.findFirst({
      where: { dayOfWeek }
    });

    if (existingSettings) {
      return res.status(400).json({ 
        message: 'Working hours for this day already exist. Use update instead.' 
      });
    }

    const workingHours = await prisma.scheduleSettings.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        isWorkingDay: isWorkingDay ?? true
      }
    });

    res.json(workingHours);
  } catch (error) {
    logger.error('Error creating working hours:', error);
    res.status(500).json({ message: 'Failed to create working hours' });
  }
};

// Schedule Exceptions
export const getScheduleExceptions = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  try {
    logger.debug('Fetching schedule exceptions:', { startDate, endDate });
    
    const exceptions = await prisma.scheduleException.findMany({
      where: {
        date: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      orderBy: { date: 'asc' }
    });

    logger.debug('Found schedule exceptions:', exceptions);
    res.json(exceptions);
  } catch (error) {
    logger.error('Error fetching schedule exceptions:', error);
    res.status(500).json({ message: 'Failed to fetch schedule exceptions' });
  }
};

export const createScheduleException = async (req: Request, res: Response) => {
  const exceptionData = req.body;
  try {
    const exception = await prisma.scheduleException.create({
      data: {
        date: new Date(exceptionData.date),
        startTime: exceptionData.startTime,
        endTime: exceptionData.endTime,
        isWorkingDay: exceptionData.isWorkingDay ?? true,
        note: exceptionData.note
      }
    });

    res.json(exception);
  } catch (error) {
    logger.error('Error creating schedule exception:', error);
    res.status(500).json({ message: 'Failed to create schedule exception' });
  }
};

export const updateScheduleException = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    const exception = await prisma.scheduleException.update({
      where: { id },
      data: {
        date: updateData.date ? new Date(updateData.date) : undefined,
        startTime: updateData.startTime,
        endTime: updateData.endTime,
        isWorkingDay: updateData.isWorkingDay,
        note: updateData.note
      }
    });
    res.json(exception);
  } catch (error) {
    logger.error('Error updating schedule exception:', error);
    res.status(500).json({ message: 'Failed to update schedule exception' });
  }
};

export const deleteScheduleException = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.scheduleException.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting schedule exception:', error);
    res.status(500).json({ 
      message: 'Failed to delete schedule exception',
      error: error.message 
    });
  }
};

// Availability
const dayNames: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const checkAvailability = async (req: Request, res: Response) => {
  const { startTime, endTime, therapistId } = req.query;
  
  try {
    logger.info('Checking availability for:', {
      startTime,
      endTime,
      therapistId
    });

    // Convert times to Date objects (these are in UTC)
    const startUtc = new Date(startTime as string);
    const endUtc = new Date(endTime as string);

    // Convert UTC to local time (Belgrade is UTC+1)
    const startLocal = new Date(startUtc.getTime() + 60 * 60 * 1000);
    const endLocal = new Date(endUtc.getTime() + 60 * 60 * 1000);

    // Get day of week from local time
    const dayOfWeek = startLocal.getDay();
    const dayName = dayNames[dayOfWeek];

    logger.info('Time conversion results:', {
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      startLocal: startLocal.toISOString(),
      endLocal: endLocal.toISOString(),
      dayOfWeek,
      dayName,
      allDayNames: dayNames
    });

    // Get working hours for the day
    const workingHours = await prisma.scheduleSettings.findFirst({
      where: {
        dayOfWeek: dayName,
        isWorkingDay: true
      }
    });

    logger.info('Working hours query:', {
      dayName,
      workingHours,
      query: {
        dayOfWeek: dayName,
        isWorkingDay: true
      }
    });

    if (!workingHours) {
      // Check if any working hours exist at all
      const allWorkingHours = await prisma.scheduleSettings.findMany();
      logger.info('No schedule settings found. All working hours in database:', allWorkingHours);

      return res.status(400).json({ 
        message: `No schedule settings found for ${dayName}. Please set up working hours for this day.`,
        debug: {
          requestedDay: dayName,
          availableDays: allWorkingHours.map(wh => wh.dayOfWeek)
        }
      });
    }

    // Check if within working hours
    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

    // Create Date objects for working hours using the local appointment date
    const workStart = new Date(startLocal);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(startLocal);
    workEnd.setHours(endHour, endMinute, 0, 0);

    logger.info('Working hours check:', {
      appointmentStartLocal: startLocal.toISOString(),
      appointmentEndLocal: endLocal.toISOString(),
      workingHoursStart: workStart.toISOString(),
      workingHoursEnd: workEnd.toISOString(),
      isBeforeWorkStart: startLocal < workStart,
      isAfterWorkEnd: endLocal > workEnd
    });

    if (startLocal < workStart || endLocal > workEnd) {
      logger.info('Time outside working hours:', { 
        startLocal: startLocal.toISOString(), 
        endLocal: endLocal.toISOString(), 
        workStart: workStart.toISOString(), 
        workEnd: workEnd.toISOString() 
      });
      return res.status(400).json({ 
        message: `Appointment must be between ${workingHours.startTime} and ${workingHours.endTime}`
      });
    }

    // Check for overlapping appointments
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        AND: [
          {
            therapistId: therapistId as string,
            status: {
              not: 'CANCELLED'
            }
          },
          {
            OR: [
              {
                startTime: {
                  lt: endUtc,
                  gte: startUtc
                }
              },
              {
                endTime: {
                  gt: startUtc,
                  lte: endUtc
                }
              }
            ]
          }
        ]
      }
    });

    logger.info('Overlapping appointments check:', {
      overlappingCount: overlappingAppointments.length,
      overlappingAppointments
    });

    if (overlappingAppointments.length > 0) {
      logger.info('Found overlapping appointments:', overlappingAppointments);
      return res.status(400).json({ 
        message: 'This time slot is already booked'
      });
    }

    // Time slot is available
    logger.info('Time slot is available');
    res.json({ available: true });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({ message: 'Failed to check availability' });
  }
};
