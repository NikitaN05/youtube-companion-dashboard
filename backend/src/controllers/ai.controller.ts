import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AIService } from '../services/ai.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * AI Controller
 * Handles AI-powered features
 */
export class AIController {
  /**
   * Validation for title suggestion request
   */
  static validateSuggestTitles = [
    body('title')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Current title is required')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),
    body('description')
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('videoId')
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
   * POST /api/ai/suggest-titles
   * Generate AI-powered title suggestions
   */
  static async suggestTitles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      AIController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { title, description, videoId } = req.body;

      const suggestions = await AIService.suggestTitles(
        req.user.id,
        title,
        description || '',
        videoId
      );
      
      res.json({
        currentTitle: title,
        suggestions
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AIController;

