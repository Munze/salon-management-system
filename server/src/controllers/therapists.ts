import { Request, Response } from 'express';
import prisma from '../prisma';
import { logger } from '../utils/logger';
import { generateSerbianPassword } from '../utils/passwordGenerator';
import bcrypt from 'bcrypt';
import { UserRole, Status } from '@prisma/client';

export const getAllTherapists = async (req: Request, res: Response) => {
  try {
    const therapists = await prisma.therapist.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(therapists);
  } catch (error) {
    logger.error('Error fetching therapists:', error);
    res.status(500).json({ message: 'Failed to fetch therapists' });
  }
};

export const createTherapist = async (req: Request, res: Response) => {
  const { name, email, phone, specialties } = req.body;

  try {
    // Generate password for the user
    const password = generateSerbianPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: UserRole.THERAPIST,
      },
    });

    // Then create therapist with user relation
    const therapist = await prisma.therapist.create({
      data: {
        name,
        email,
        phone,
        specialties,
        user: {
          connect: {
            id: user.id
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Return the created therapist with the temporary password
    res.status(201).json({
      therapist,
      temporaryPassword: password
    });

  } catch (error) {
    logger.error('Error creating therapist:', error);
    res.status(500).json({ message: 'Failed to create therapist' });
  }
};

export const updateTherapist = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, specialties } = req.body;

  try {
    // Start a transaction to update both therapist and user
    await prisma.$transaction(async (prisma) => {
      // Update therapist
      const therapist = await prisma.therapist.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          specialties,
        },
      });

      // Update corresponding user account
      await prisma.user.updateMany({
        where: { email: therapist.email },
        data: {
          name,
          email,
          phone,
        },
      });

      return therapist;
    });

    res.json({ message: 'Therapist and user account updated successfully' });
  } catch (error) {
    logger.error('Error updating therapist:', error);
    res.status(500).json({ message: 'Failed to update therapist' });
  }
};

export const deleteTherapist = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if therapist exists and has active appointments
    const therapist = await prisma.therapist.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            OR: [
              { status: Status.SCHEDULED },
              { status: Status.CONFIRMED },
              { status: Status.IN_PROGRESS }
            ]
          }
        }
      }
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Check for active appointments
    if (therapist.appointments?.length > 0) {
      return res.status(400).json({ 
        message: 'Ne možete obrisati terapeuta koji ima zakazane termine. Prvo otkažite ili promenite terapeuta za postojeće termine.' 
      });
    }

    // Delete completed/cancelled appointments
    await prisma.appointment.deleteMany({
      where: { 
        therapistId: id,
        status: {
          in: [Status.COMPLETED, Status.CANCELLED, Status.NO_SHOW]
        }
      }
    });

    // Delete the therapist
    await prisma.therapist.delete({
      where: { id }
    });

    res.json({ message: 'Therapist deleted successfully' });
  } catch (error) {
    logger.error('Error deleting therapist:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTherapistById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const therapist = await prisma.therapist.findUnique({
      where: { id },
    });

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json(therapist);
  } catch (error) {
    logger.error('Error fetching therapist:', error);
    res.status(500).json({ message: 'Failed to fetch therapist' });
  }
};
