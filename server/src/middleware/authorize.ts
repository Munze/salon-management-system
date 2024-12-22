import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
    }
  }
}

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({ message: 'Unauthorized - No role found' });
      }

      if (!allowedRoles.includes(userRole as UserRole)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({ message: 'Internal server error during authorization' });
    }
  };
};
