import { Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { NoteService } from '../services/note.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * Note Controller
 * Handles note CRUD endpoints
 */
export class NoteController {
  /**
   * Validation for creating a note
   */
  static validateCreateNote = [
    body('content')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 10000 })
      .withMessage('Content must not exceed 10000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('videoId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Video ID is required')
  ];

  /**
   * Validation for updating a note
   */
  static validateUpdateNote = [
    param('noteId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Note ID is required'),
    body('content')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 10000 })
      .withMessage('Content must not exceed 10000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
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
   * POST /api/notes
   * Create a new note
   */
  static async createNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      NoteController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { content, tags, videoId } = req.body;
      const note = await NoteService.createNote(req.user.id, { content, tags, videoId });
      
      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notes
   * Get all notes for the user with optional search/filter
   */
  static async getNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const keyword = req.query.keyword as string | undefined;
      const tag = req.query.tag as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NoteService.getUserNotes(req.user.id, {
        keyword,
        tag,
        page,
        limit
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notes/video/:videoId
   * Get notes for a specific video
   */
  static async getNotesByVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { videoId } = req.params;
      const notes = await NoteService.getNotesByVideo(req.user.id, videoId);
      
      res.json(notes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notes/:noteId
   * Get a single note
   */
  static async getNoteById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { noteId } = req.params;
      const note = await NoteService.getNoteById(req.user.id, noteId);
      
      res.json(note);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notes/:noteId
   * Update a note
   */
  static async updateNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      NoteController.handleValidationErrors(req);
      
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { noteId } = req.params;
      const { content, tags } = req.body;

      if (content === undefined && tags === undefined) {
        throw new ApiError(400, 'At least one of content or tags must be provided');
      }

      const note = await NoteService.updateNote(req.user.id, noteId, { content, tags });
      
      res.json(note);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notes/:noteId
   * Delete a note
   */
  static async deleteNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { noteId } = req.params;
      await NoteService.deleteNote(req.user.id, noteId);
      
      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notes/tags/all
   * Get all unique tags for the user
   */
  static async getUserTags(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const tags = await NoteService.getUserTags(req.user.id);
      
      res.json(tags);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notes/search
   * Search notes by keyword
   */
  static async searchNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const keyword = req.query.q as string;
      if (!keyword) {
        throw new ApiError(400, 'Search query is required');
      }

      const notes = await NoteService.searchNotes(req.user.id, keyword);
      
      res.json(notes);
    } catch (error) {
      next(error);
    }
  }
}

export default NoteController;

