import { google } from 'googleapis';
import prisma from '../config/prisma';
import { oauth2Client, getAuthUrl, YOUTUBE_SCOPES } from '../config/google';
import { encrypt, decrypt } from '../utils/encryption';
import { generateToken } from '../middleware/auth';
import EventService, { EventType } from './event.service';

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope: string;
}

/**
 * Authentication Service
 * Handles Google OAuth flow and token management
 */
export class AuthService {
  /**
   * Get the Google OAuth authorization URL
   */
  static getAuthorizationUrl(): string {
    return getAuthUrl();
  }

  /**
   * Exchange authorization code for tokens and create/update user
   */
  static async handleCallback(code: string) {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Failed to get user information from Google');
    }

    // Get YouTube channel ID if available
    let channelId: string | null = null;
    try {
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const channelResponse = await youtube.channels.list({
        part: ['id'],
        mine: true
      });
      channelId = channelResponse.data.items?.[0]?.id || null;
    } catch (error) {
      console.warn('Could not fetch YouTube channel ID:', error);
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { googleId: userInfo.id },
      update: {
        email: userInfo.email,
        name: userInfo.name || null,
        avatarUrl: userInfo.picture || null,
        channelId
      },
      create: {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || null,
        avatarUrl: userInfo.picture || null,
        channelId
      }
    });

    // Store encrypted tokens
    const tokenData = tokens as TokenResponse;
    
    await prisma.oAuthToken.upsert({
      where: { userId: user.id },
      update: {
        accessToken: encrypt(tokenData.access_token),
        refreshToken: tokenData.refresh_token 
          ? encrypt(tokenData.refresh_token) 
          : undefined,
        accessTokenExpiresAt: tokenData.expiry_date 
          ? new Date(tokenData.expiry_date) 
          : new Date(Date.now() + 3600000),
        scope: tokenData.scope || YOUTUBE_SCOPES.join(' ')
      },
      create: {
        userId: user.id,
        accessToken: encrypt(tokenData.access_token),
        refreshToken: encrypt(tokenData.refresh_token || ''),
        accessTokenExpiresAt: tokenData.expiry_date 
          ? new Date(tokenData.expiry_date) 
          : new Date(Date.now() + 3600000),
        scope: tokenData.scope || YOUTUBE_SCOPES.join(' ')
      }
    });

    // Log login event
    await EventService.log(EventType.LOGIN, user.id, {
      email: user.email,
      ip: 'server-side'
    });

    // Generate JWT for the user
    const jwt = generateToken({
      id: user.id,
      email: user.email,
      googleId: user.googleId
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        channelId: user.channelId
      },
      token: jwt
    };
  }

  /**
   * Get a valid access token for a user (refreshes if needed)
   */
  static async getValidAccessToken(userId: string): Promise<string> {
    const tokenRecord = await prisma.oAuthToken.findUnique({
      where: { userId }
    });

    if (!tokenRecord) {
      throw new Error('No OAuth token found for user');
    }

    const now = new Date();
    const expiresAt = new Date(tokenRecord.accessTokenExpiresAt);
    
    // Check if token is expired (with 5 minute buffer)
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      // Token is expired or about to expire, refresh it
      return this.refreshAccessToken(userId, tokenRecord.refreshToken);
    }

    return decrypt(tokenRecord.accessToken);
  }

  /**
   * Refresh the access token using the refresh token
   */
  private static async refreshAccessToken(userId: string, encryptedRefreshToken: string): Promise<string> {
    const refreshToken = decrypt(encryptedRefreshToken);
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update stored tokens
    await prisma.oAuthToken.update({
      where: { userId },
      data: {
        accessToken: encrypt(credentials.access_token),
        accessTokenExpiresAt: credentials.expiry_date 
          ? new Date(credentials.expiry_date) 
          : new Date(Date.now() + 3600000),
        ...(credentials.refresh_token && {
          refreshToken: encrypt(credentials.refresh_token)
        })
      }
    });

    return credentials.access_token;
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        channelId: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Logout user (revoke tokens and cleanup)
   */
  static async logout(userId: string) {
    try {
      // Get the token to revoke
      const tokenRecord = await prisma.oAuthToken.findUnique({
        where: { userId }
      });

      if (tokenRecord) {
        const accessToken = decrypt(tokenRecord.accessToken);
        // Revoke the token with Google
        await oauth2Client.revokeToken(accessToken).catch(() => {
          // Ignore revocation errors
        });
      }

      // Log logout event
      await EventService.log(EventType.LOGOUT, userId, {});

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true }; // Still consider logout successful
    }
  }
}

export default AuthService;

