import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All event routes require authentication
router.use(authenticate);

// Get event statistics
router.get('/stats', EventController.getEventStats);

// Get event logs
router.get('/', EventController.validateGetEvents, EventController.getEvents);

export default router;

