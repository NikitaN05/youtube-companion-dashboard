import { google, youtube_v3 } from 'googleapis';
import prisma from '../config/prisma';
import { AuthService } from './auth.service';
import EventService, { EventType } from './event.service';
import { ApiError, handleYouTubeQuotaError } from '../middleware/errorHandler';

interface VideoDetails {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date | null;
  privacyStatus: string;
}

/**
 * YouTube Service
 * Handles all YouTube Data API v3 interactions
 */
export class YouTubeService {
  /**
   * Get authenticated YouTube client for a user
   */
  private static async getClient(userId: string): Promise<youtube_v3.Youtube> {
    const accessToken = await AuthService.getValidAccessToken(userId);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth });
  }

  /**
   * Fetch details of an unlisted video by ID
   */
  static async getVideoDetails(userId: string, videoId: string): Promise<VideoDetails> {
    try {
      const youtube = await this.getClient(userId);
      
      const response = await youtube.videos.list({
        part: ['snippet', 'statistics', 'status'],
        id: [videoId]
      });

      const video = response.data.items?.[0];
      
      if (!video) {
        throw new ApiError(404, 'Video not found or you do not have access to it');
      }

      const snippet = video.snippet!;
      const statistics = video.statistics!;
      const status = video.status!;

      // Upsert video in database for caching
      const dbVideo = await prisma.video.upsert({
        where: {
          youtubeVideoId_userId: {
            youtubeVideoId: videoId,
            userId
          }
        },
        update: {
          title: snippet.title || '',
          description: snippet.description || null,
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
          viewCount: parseInt(statistics.viewCount || '0'),
          likeCount: parseInt(statistics.likeCount || '0'),
          commentCount: parseInt(statistics.commentCount || '0'),
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
          privacyStatus: status.privacyStatus || 'unlisted',
          lastSyncedAt: new Date()
        },
        create: {
          youtubeVideoId: videoId,
          userId,
          title: snippet.title || '',
          description: snippet.description || null,
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
          viewCount: parseInt(statistics.viewCount || '0'),
          likeCount: parseInt(statistics.likeCount || '0'),
          commentCount: parseInt(statistics.commentCount || '0'),
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
          privacyStatus: status.privacyStatus || 'unlisted'
        }
      });

      // Log fetch event
      await EventService.log(EventType.FETCH_VIDEO, userId, {
        videoId,
        title: snippet.title
      });

      return {
        id: dbVideo.id,
        youtubeVideoId: videoId,
        title: dbVideo.title,
        description: dbVideo.description,
        thumbnailUrl: dbVideo.thumbnailUrl,
        viewCount: dbVideo.viewCount,
        likeCount: dbVideo.likeCount,
        commentCount: dbVideo.commentCount,
        publishedAt: dbVideo.publishedAt,
        privacyStatus: dbVideo.privacyStatus
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw handleYouTubeQuotaError(error);
    }
  }

  /**
   * Update video metadata (title and/or description)
   */
  static async updateVideoMetadata(
    userId: string,
    videoId: string,
    updates: { title?: string; description?: string }
  ): Promise<VideoDetails> {
    try {
      const youtube = await this.getClient(userId);

      // First, get current video data
      const currentVideo = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [videoId]
      });

      const video = currentVideo.data.items?.[0];
      if (!video) {
        throw new ApiError(404, 'Video not found');
      }

      // Prepare update request
      const updateData: youtube_v3.Schema$Video = {
        id: videoId,
        snippet: {
          title: updates.title || video.snippet?.title,
          description: updates.description !== undefined 
            ? updates.description 
            : video.snippet?.description,
          categoryId: video.snippet?.categoryId // Required field
        }
      };

      // Update video on YouTube
      await youtube.videos.update({
        part: ['snippet'],
        requestBody: updateData
      });

      // Log update event
      await EventService.log(EventType.UPDATE_VIDEO_METADATA, userId, {
        videoId,
        updatedFields: Object.keys(updates),
        newTitle: updates.title,
        newDescription: updates.description?.substring(0, 100) + '...'
      });

      // Fetch and return updated video details
      return this.getVideoDetails(userId, videoId);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw handleYouTubeQuotaError(error);
    }
  }

  /**
   * Get user's uploaded videos (for video selection)
   */
  static async getUserVideos(userId: string, maxResults: number = 10) {
    try {
      const youtube = await this.getClient(userId);

      // Get the user's uploads playlist
      const channelResponse = await youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });

      const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        return [];
      }

      // Get videos from uploads playlist
      const playlistResponse = await youtube.playlistItems.list({
        part: ['snippet', 'status'],
        playlistId: uploadsPlaylistId,
        maxResults
      });

      return playlistResponse.data.items?.map(item => ({
        videoId: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
        privacyStatus: item.status?.privacyStatus
      })) || [];
    } catch (error: any) {
      throw handleYouTubeQuotaError(error);
    }
  }
}

export default YouTubeService;

