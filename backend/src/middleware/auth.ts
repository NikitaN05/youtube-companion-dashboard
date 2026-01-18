import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { ApiError } from './errorHandler';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    googleId: string;
  };
}

// JWT payload structure
interface JwtPayload {
  userId: string;
  email: string;
  googleId: string;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    // Fallback to cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      googleId: user.googleId
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token expired'));
    }
    next(error);
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: string; email: string; googleId: string }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      googleId: user.googleId
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

