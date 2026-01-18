import { google } from 'googleapis';

// Google OAuth2 client configuration
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// YouTube Data API v3 scopes
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',      // Read-only access to YouTube account
  'https://www.googleapis.com/auth/youtube.force-ssl',     // Manage YouTube videos (comments, metadata)
  'openid',                                                 // OpenID Connect
  'email',                                                  // User email
  'profile'                                                 // User profile info
];

// Generate the OAuth URL for user consent
export const getAuthUrl = (): string => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',           // Required for refresh token
    scope: YOUTUBE_SCOPES,
    prompt: 'consent',                // Force consent to get refresh token
    include_granted_scopes: true
  });
};

// YouTube API client factory
export const getYouTubeClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.youtube({ version: 'v3', auth });
};

export default oauth2Client;

