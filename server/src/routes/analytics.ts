import express from 'express';
import { getAnalytics, getServiceAnalytics, getTherapistAnalytics } from '../controllers/analytics';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    await getAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/services', authenticate, async (req, res, next) => {
  try {
    await getServiceAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/by-service', authenticate, async (req, res, next) => {
  try {
    await getServiceAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/by-therapist', authenticate, async (req, res, next) => {
  try {
    await getTherapistAnalytics(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
