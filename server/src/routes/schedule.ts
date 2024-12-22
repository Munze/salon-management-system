import express from 'express';
import { authorize } from '../middleware/authorize';
import { authenticate } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getWorkingHours,
  updateWorkingHours,
  updateAllWorkingHours,
  createWorkingHours,
  getScheduleExceptions,
  createScheduleException,
  updateScheduleException,
  deleteScheduleException
} from '../controllers/schedule';

const router = express.Router();

// Working Hours routes
router.get('/working-hours', authenticate, getWorkingHours);
router.post('/working-hours', authenticate, authorize([UserRole.ADMIN]), createWorkingHours);
router.put('/working-hours', authenticate, authorize([UserRole.ADMIN]), updateAllWorkingHours);
router.put('/working-hours/:id', authenticate, authorize([UserRole.ADMIN]), updateWorkingHours);

// Schedule Exceptions routes
router.get('/exceptions', authenticate, getScheduleExceptions);
router.post('/exceptions', authenticate, authorize([UserRole.ADMIN]), createScheduleException);
router.put('/exceptions/:id', authenticate, authorize([UserRole.ADMIN]), updateScheduleException);
router.delete('/exceptions/:id', authenticate, authorize([UserRole.ADMIN]), deleteScheduleException);

export default router;
