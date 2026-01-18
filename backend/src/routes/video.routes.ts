import { Router } from 'express';
import { VideoController } from '../controllers/video.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All video routes require authentication
router.use(authenticate);

// Get user's uploaded videos
router.get('/user/list', VideoController.getUserVideos);

// Get video details
router.get(
  '/:videoId',
  VideoController.validateVideoId,
  VideoController.getVideoDetails
);

// Update video metadata
router.put(
  '/:videoId',
  VideoController.validateVideoId,
  VideoController.validateMetadataUpdate,
  VideoController.updateVideoMetadata
);

export default router;

