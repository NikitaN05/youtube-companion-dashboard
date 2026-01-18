import { Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CommentService } from '../services/comment.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * Comment Controller
 * Handles comment-related endpoints
 */
export class CommentController {
  /**
   * Validation for getting comments
   */
  static validateGetComments = [
    param('videoId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Video ID is required'),
    query('pageToken')
      .optional()
      .isString(),
    query('maxResults')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('maxResults must be between 1 and 100')
  ];

  /**
   * Validation for adding a comment
   */
  static validateAddComment = [
    param('videoId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Video ID is required'),
    body('text')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Comment text is required')
      .isLength({ max: 10000 })
      .withMessage('Comment must not exceed 10000 characters')
  ];

  /**
   * Validation for replying to a comment
   */
  static validateReply = [
    param('commentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Comment ID is required'),
    body('text')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Reply text is required')
      .isLength({ max: 10000 })
      .withMessage('Reply must not exceed 10000 characters')
  ];

  /**
   * Validation for deleting a comment
   */
  static validateDeleteComment = [
    param('commentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Comment ID is required')
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
   * GET /api/comments/:videoId
   * Fetch comments for a video
   */
  static async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      CommentController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { videoId } = req.params;
      const pageToken = req.query.pageToken as string | undefined;
      const maxResults = parseInt(req.query.maxResults as string) || 20;

      const result = await CommentService.getComments(
        req.user.id,
        videoId,
        pageToken,
        maxResults
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments/:videoId
   * Add a new comment to a video
   */
  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      CommentController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { videoId } = req.params;
      const { text } = req.body;

      const comment = await CommentService.addComment(req.user.id, videoId, text);
      
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments/:commentId/reply
   * Reply to an existing comment
   */
  static async replyToComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      CommentController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { commentId } = req.params;
      const { text } = req.body;

      const reply = await CommentService.replyToComment(req.user.id, commentId, text);
      
      res.status(201).json(reply);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * Delete a comment (only own comments)
   */
  static async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      CommentController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { commentId } = req.params;

      await CommentService.deleteComment(req.user.id, commentId);
      
      res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default CommentController;

