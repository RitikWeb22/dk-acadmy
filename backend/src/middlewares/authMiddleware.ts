import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, type IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
  file?: any;
  files?: any;
}

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no access token provided.' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'F7x6LaFFrx1V4PSoHdi4iP5pSta4h7Ay2M6fu5R8r0k';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    if (!decoded || !decoded.id) {
      res.status(401).json({ success: false, message: 'Malformed authentication token payload.' });
      return;
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        next();
        return;
      }
    }

    // Cryptographically verified stateless / fallback user
    req.user = {
      _id: decoded.id as any,
      id: decoded.id,
      role: (decoded.role || 'STUDENT') as any
    } as any;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error?.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Invalid authentication token signature.'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = (req.user?.role || '').toUpperCase();
    const normalizedRoles = roles.map((r) => r.toUpperCase());
    if (!req.user || !normalizedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Role (${req.user?.role}) is not authorized to access this resource`
      });
      return;
    }
    next();
  };
};
