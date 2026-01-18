import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/login', AuthController.login);
router.get('/url', AuthController.getAuthUrl);
router.get('/callback', AuthController.callback);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/logout', authenticate, AuthController.logout);
router.get('/verify', authenticate, AuthController.verify);

export default router;

