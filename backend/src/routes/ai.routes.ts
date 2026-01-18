import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Generate title suggestions
router.post(
  '/suggest-titles',
  AIController.validateSuggestTitles,
  AIController.suggestTitles
);

export default router;

