import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  salonId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        salonId: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info(`Authenticating request to: ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('No token provided in authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        logger.warn(`User not found for token with user ID ${decoded.userId}`);
        return res.status(401).json({ message: 'User not found' });
      }

      logger.debug(`Token decoded successfully. User ID: ${decoded.userId}, Role: ${decoded.role}`);
      // Set user info in request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        salonId: user.salonId
      };

      next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};
