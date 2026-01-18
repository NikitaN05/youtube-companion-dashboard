import { Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { EventService } from '../services/event.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * Event Controller
 * Handles event log endpoints
 */
export class EventController {
  /**
   * Validation for getting events
   */
  static validateGetEvents = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('eventType')
      .optional()
      .isString()
      .trim()
  ];

  /**
   * Handle validation errors
   */
  private static handleValidationErrors(req: AuthenticatedRequest) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array().map(e => e.msg).join(', '));
    }
  }

  /**
   * GET /api/events
   * Get event logs for the current user
   */
  static async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      EventController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const eventType = req.query.eventType as string | undefined;

      const result = await EventService.getUserEvents(req.user.id, {
        page,
        limit,
        eventType
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/stats
   * Get event statistics for the current user
   */
  static async getEventStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const stats = await EventService.getEventStats(req.user.id);
      
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;

