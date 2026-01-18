import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// YouTube API quota error handler
export const handleYouTubeQuotaError = (error: any): ApiError => {
  if (error?.response?.status === 403) {
    const reason = error?.response?.data?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') {
      return new ApiError(429, 'YouTube API quota exceeded. Please try again later.');
    }
    if (reason === 'forbidden') {
      return new ApiError(403, 'You do not have permission to perform this action.');
    }
  }
  return new ApiError(500, 'An error occurred with the YouTube API');
};

// Global error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  // Handle API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database error',
      message: 'An error occurred while processing your request'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

