import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { startOfDay } from 'date-fns';
import { logger } from '../utils/logger';
import { sendAppointmentConfirmation } from '../services/email';
import prisma from '../lib/prisma';

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all appointments...');
    const user = req.user as any;
    
    console.log('User requesting appointments:', { 
      email: user.email, 
      role: user.role,
      id: user.id
    });

    if (!user || !user.email) {
      console.error('No user or email found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const whereClause: any = {};
    
    // If user is a therapist, only show their appointments
    if (user.role === 'THERAPIST') {
      console.log('User is a therapist, finding therapist record by email:', user.email);
      
      try {
        // First find the therapist by user's email
        const therapist = await prisma.therapist.findUnique({
          where: { email: user.email }
        });
        
        console.log('Found therapist:', therapist);
        
        if (!therapist) {
          console.log('No therapist found for email:', user.email);
          return res.status(404).json({ message: 'Therapist not found' });
        }
        
        whereClause.therapistId = therapist.id;
        console.log('Updated where clause with therapistId:', whereClause);
      } catch (error) {
        console.error('Error finding therapist:', error);
        return res.status(500).json({ message: 'Error finding therapist' });
      }
    }

    try {
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          client: true,
          therapist: true,
          service: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      console.log(`Found ${appointments.length} appointments`);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ message: 'Error fetching appointments' });
    }
  } catch (error) {
    console.error('Error in getAllAppointments:', error);
    logger.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', details: error.message });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startTime, endTime, clientId, therapistId, serviceId, notes, price } = req.body;

    const appointmentStart = new Date(startTime);
    const appointmentEnd = new Date(endTime);

    // Get day of week (0-6, Sunday-Saturday)
    const jsDay = appointmentStart.getUTCDay();
    // Convert to day name
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[jsDay];

    logger.info('Checking working hours for day', {
      appointmentStart: appointmentStart.toISOString(),
      appointmentEnd: appointmentEnd.toISOString(),
      dayName
    });

    try {
      // Get global schedule settings
      const scheduleSettings = await prisma.scheduleSettings.findFirst({
        where: {
          dayOfWeek: dayName,
          isWorkingDay: true
        }
      });

      if (!scheduleSettings) {
        return res.status(400).json({
          message: 'No schedule settings found for this day'
        });
      }

      logger.info('Schedule settings:', {
        settings: scheduleSettings,
        jsDay,
        dayName
      });

      if (!scheduleSettings.isWorkingDay) {
        return res.status(400).json({
          message: `The salon is not open on this day`
        });
      }

      // Parse working hours
      const [workStartHours, workStartMinutes] = scheduleSettings.startTime.split(':').map(Number);
      const [workEndHours, workEndMinutes] = scheduleSettings.endTime.split(':').map(Number);

      // Create working hours times
      const workStartTime = new Date(appointmentStart);
      workStartTime.setUTCHours(workStartHours, workStartMinutes, 0, 0);
      
      const workEndTime = new Date(appointmentStart);
      workEndTime.setUTCHours(workEndHours, workEndMinutes, 0, 0);

      // Check if appointment is within working hours
      if (appointmentStart < workStartTime || appointmentEnd > workEndTime) {
        return res.status(400).json({
          message: `Appointment time must be between ${scheduleSettings.startTime} and ${scheduleSettings.endTime}`
        });
      }

      // Check for scheduling conflicts
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          therapistId,
          NOT: { status: 'CANCELLED' },
          AND: [
            { startTime: { lt: appointmentEnd } }, 
            { endTime: { gt: appointmentStart } }, 
          ]
        },
      });

      if (conflictingAppointment) {
        return res.status(409).json({
          message: 'This time slot conflicts with another appointment',
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          startTime: appointmentStart,
          endTime: appointmentEnd,
          clientId,
          therapistId,
          serviceId,
          notes,
          price: parseFloat(price),
        },
        include: {
          client: true,
          therapist: true,
          service: true,
        },
      });

      // Send confirmation email
      if (appointment.client?.email) {
        await sendAppointmentConfirmation(
          appointment.client.email,
          appointment.client.name,
          appointment.startTime,
          appointment.service.name,
          appointment.therapist.name
        );
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      logger.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Failed to create appointment', details: error.message });
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    logger.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment', details: error.message });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, clientId, therapistId, serviceId, notes, status, price } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        clientId,
        therapistId,
        serviceId,
        notes,
        status,
        price: price ? parseFloat(price) : undefined,
      },
      include: {
        client: true,
        therapist: true,
        service: true,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    logger.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment', details: error.message });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({
      where: { id },
    });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    logger.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Failed to delete appointment', details: error.message });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, therapistId } = req.query;

    logger.info('Checking availability with params:', {
      startTime,
      endTime,
      therapistId
    });

    if (!startTime || !endTime || !therapistId) {
      return res.status(400).json({
        message: 'startTime, endTime, and therapistId are required query parameters',
      });
    }

    // Get day of week for the appointment
    const appointmentStart = new Date(startTime as string);
    const appointmentEnd = new Date(endTime as string);
    
    // Get day of week (0-6, Sunday-Saturday)
    const jsDay = appointmentStart.getUTCDay();
    // Convert to day name
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[jsDay];
    
    logger.info(`Checking working hours for day ${dayName}`, {
      appointmentStart: appointmentStart.toISOString(),
      appointmentEnd: appointmentEnd.toISOString(),
      jsDay,
      dayName
    });
    
    try {
      // Get global schedule settings
      const scheduleSettings = await prisma.scheduleSettings.findFirst({
        where: {
          dayOfWeek: dayName
        }
      });

      logger.info('Found schedule settings:', scheduleSettings);

      if (!scheduleSettings) {
        return res.status(400).json({
          message: 'No schedule settings found for this day'
        });
      }

      logger.info('Schedule settings:', {
        settings: scheduleSettings,
        jsDay,
        dayName
      });

      if (!scheduleSettings.isWorkingDay) {
        return res.status(400).json({
          message: `The salon is not open on this day`
        });
      }

      // Parse working hours
      const [workStartHours, workStartMinutes] = scheduleSettings.startTime.split(':').map(Number);
      const [workEndHours, workEndMinutes] = scheduleSettings.endTime.split(':').map(Number);

      // Create working hours times
      const workStartTime = new Date(appointmentStart);
      workStartTime.setUTCHours(workStartHours, workStartMinutes, 0, 0);
      
      const workEndTime = new Date(appointmentStart);
      workEndTime.setUTCHours(workEndHours, workEndMinutes, 0, 0);

      logger.info('Working hours:', {
        workStartTime: workStartTime.toISOString(),
        workEndTime: workEndTime.toISOString(),
        appointmentStart: appointmentStart.toISOString(),
        appointmentEnd: appointmentEnd.toISOString()
      });

      // Check if appointment is within working hours
      if (appointmentStart < workStartTime || appointmentEnd > workEndTime) {
        logger.info('Appointment is outside working hours', {
          appointmentStart: appointmentStart.toISOString(),
          appointmentEnd: appointmentEnd.toISOString(),
          workStart: workStartTime.toISOString(),
          workEnd: workEndTime.toISOString()
        });
        return res.json({ 
          available: false,
          reason: 'outside_working_hours',
          message: `Appointment time must be between ${scheduleSettings.startTime} and ${scheduleSettings.endTime}`
        });
      }

      // Check for conflicts with existing appointments
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          therapistId: therapistId as string,
          NOT: { status: 'CANCELLED' },
          AND: [
            { startTime: { lt: appointmentEnd } },
            { endTime: { gt: appointmentStart } },
            { NOT: { id: req.query.excludeId as string } }  // Exclude the current appointment if editing
          ]
        },
        include: {
          client: true,
          service: true
        }
      });
      
      logger.info('Checking appointments for therapist:', therapistId);
      logger.info('Requested time slot:', {
        start: appointmentStart.toISOString(),
        end: appointmentEnd.toISOString(),
      });
      
      if (existingAppointments.length > 0) {
        const conflictInfo = existingAppointments.map(apt => ({
          start: apt.startTime.toISOString(),
          end: apt.endTime.toISOString(),
          client: apt.client.name,
          service: apt.service.name
        }));
        
        logger.info('Found conflicting appointments:', conflictInfo);
        return res.json({ 
          available: false,
          reason: 'overlap',
          message: 'This time slot conflicts with another appointment',
          conflicts: conflictInfo
        });
      }

      logger.info('No conflicts found, time slot is available');
      return res.json({
        available: true
      });
    } catch (dbError) {
      logger.error('Database error while checking availability:', dbError);
      throw dbError;
    }
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({ message: 'Failed to check availability' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    console.log('User requesting upcoming appointments:', { 
      email: user.email, 
      role: user.role,
      id: user.id
    });

    if (!user || !user.email) {
      console.error('No user or email found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const today = startOfDay(new Date());
    console.log('Today:', today);

    // Build where clause
    const whereClause: any = {
      startTime: {
        gte: today,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'] // Using enum values from Prisma schema
      }
    };

    console.log('Initial where clause:', whereClause);

    // If user is a therapist, only show their appointments
    if (user.role === 'THERAPIST') {
      console.log('User is a therapist, finding therapist record by email:', user.email);
      
      try {
        // First find the therapist by user's email since it's unique
        const therapist = await prisma.therapist.findUnique({
          where: { email: user.email }
        });
        
        console.log('Found therapist:', therapist);
        
        if (!therapist) {
          console.log('No therapist found for email:', user.email);
          return res.status(404).json({ message: 'Therapist not found' });
        }
        
        whereClause.therapistId = therapist.id;
        console.log('Updated where clause with therapistId:', whereClause);
      } catch (error) {
        console.error('Error finding therapist:', error);
        return res.status(500).json({ message: 'Error finding therapist' });
      }
    }

    try {
      // First get all appointments that match the criteria
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          client: true,
          therapist: true,
          service: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      console.log(`Found ${appointments.length} upcoming appointments`);

      // Log each appointment for debugging
      appointments.forEach((appt, index) => {
        console.log(`Appointment ${index + 1}:`, {
          id: appt.id,
          startTime: appt.startTime,
          clientName: appt.client?.name,
          therapistName: appt.therapist?.name,
          status: appt.status
        });
      });

      return res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ message: 'Error fetching appointments' });
    }
  } catch (error) {
    console.error('Error in getUpcomingAppointments:', error);
    return res.status(500).json({ message: 'Failed to fetch upcoming appointments' });
  }
};
