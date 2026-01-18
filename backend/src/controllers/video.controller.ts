import { Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { YouTubeService } from '../services/youtube.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * Video Controller
 * Handles video-related endpoints
 */
export class VideoController {
  /**
   * Validation middleware for video ID
   */
  static validateVideoId = [
    param('videoId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Video ID is required')
      .isLength({ min: 11, max: 11 })
      .withMessage('Invalid YouTube video ID format')
  ];

  /**
   * Validation middleware for video metadata update
   */
  static validateMetadataUpdate = [
    body('title')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
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
   * GET /api/videos/:videoId
   * Fetch details of a video
   */
  static async getVideoDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      VideoController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { videoId } = req.params;
      const video = await YouTubeService.getVideoDetails(req.user.id, videoId);
      
      res.json(video);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/videos/:videoId
   * Update video metadata (title and/or description)
   */
  static async updateVideoMetadata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      VideoController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { videoId } = req.params;
      const { title, description } = req.body;

      if (!title && description === undefined) {
        throw new ApiError(400, 'At least one of title or description must be provided');
      }

      const updatedVideo = await YouTubeService.updateVideoMetadata(
        req.user.id,
        videoId,
        { title, description }
      );
      
      res.json(updatedVideo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/user/list
   * Get user's uploaded videos (for video selection)
   */
  static async getUserVideos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const maxResults = parseInt(req.query.maxResults as string) || 10;
      const videos = await YouTubeService.getUserVideos(req.user.id, maxResults);
      
      res.json(videos);
    } catch (error) {
      next(error);
    }
  }
}

export default VideoController;

