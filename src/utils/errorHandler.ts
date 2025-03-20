import { Request, Response, NextFunction } from 'express';
import logger from './logger';
import { ErrorResponse } from '../interfaces/llm.interface';

export interface ApiErrorResponse extends ErrorResponse {
  statusCode?: number;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a standardized error response
 * @param message - User-friendly error message
 * @param error - Technical error details
 * @param statusCode - HTTP status code
 */
export const createErrorResponse = (
  message: string,
  error: string,
  statusCode: number = 500
): ApiErrorResponse => {
  if (statusCode === 500) {
    return {
      success: false,
      message: message === 'Request failed' ? 'Failed to process request' : message,
      error: error,
      statusCode,
    };
  }
  
  return {
    success: false,
    message,
    error,
    statusCode,
  };
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const errorMessage = err.message || 'Unknown error';

  logger.error(`Error: ${errorMessage}`);

  res.status(statusCode).json(createErrorResponse('Request failed', errorMessage, statusCode));
};

/**
 * Higher-order function that wraps controller methods with try/catch error handling
 * @param fn - Controller method to wrap
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error(`Error in controller: ${errorMessage}`);
      
      let message = 'Failed to process request';
      let formattedError = errorMessage;
      
      if (errorMessage === 'Summarization failed') {
        message = 'Failed to summarize caption';
      }
      
      res.status(statusCode).json(createErrorResponse(message, formattedError, statusCode));
    }
  };
};

/**
 * Utility function to handle validation errors
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 */
export const handleValidationError = (
  res: Response,
  message: string,
  statusCode: number = 400
): void => {
  logger.warn(`Validation error: ${message}`);

  res.status(statusCode).json(createErrorResponse('Validation failed', message, statusCode));
};
