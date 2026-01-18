import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All comment routes require authentication
router.use(authenticate);

// Get comments for a video
router.get(
  '/:videoId',
  CommentController.validateGetComments,
  CommentController.getComments
);

// Add a new comment to a video
router.post(
  '/:videoId',
  CommentController.validateAddComment,
  CommentController.addComment
);

// Reply to a comment
router.post(
  '/:commentId/reply',
  CommentController.validateReply,
  CommentController.replyToComment
);

// Delete a comment (only own comments)
router.delete(
  '/:commentId',
  CommentController.validateDeleteComment,
  CommentController.deleteComment
);

export default router;

