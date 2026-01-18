import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

/**
 * Auth Controller
 * Handles authentication endpoints
 */
export class AuthController {
  /**
   * GET /api/auth/login
   * Redirects to Google OAuth consent screen
   */
  static login(req: Request, res: Response) {
    const authUrl = AuthService.getAuthorizationUrl();
    res.redirect(authUrl);
  }

  /**
   * GET /api/auth/url
   * Returns the OAuth URL for frontend-initiated auth
   */
  static getAuthUrl(req: Request, res: Response) {
    const authUrl = AuthService.getAuthorizationUrl();
    res.json({ url: authUrl });
  }

  /**
   * GET /api/auth/callback
   * OAuth callback handler
   */
  static async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error as string)}`
        );
      }

      if (!code || typeof code !== 'string') {
        throw new ApiError(400, 'Authorization code is required');
      }

      const { user, token } = await AuthService.handleCallback(code);

      // Set HTTP-only cookie with JWT
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with token in URL for SPA handling
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${token}`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  static async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const user = await AuthService.getUserProfile(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.id);
      }

      // Clear cookie
      res.clearCookie('token');
      
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify
   * Verify if token is valid
   */
  static verify(req: AuthenticatedRequest, res: Response) {
    res.json({ 
      valid: true, 
      user: req.user 
    });
  }
}

export default AuthController;

