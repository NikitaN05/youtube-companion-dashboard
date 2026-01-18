import { google, youtube_v3 } from 'googleapis';
import { AuthService } from './auth.service';
import EventService, { EventType } from './event.service';
import { ApiError, handleYouTubeQuotaError } from '../middleware/errorHandler';

interface Comment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelId: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  canDelete: boolean;
  replies?: Comment[];
}

interface CommentThread {
  id: string;
  topLevelComment: Comment;
  totalReplyCount: number;
  replies: Comment[];
}

/**
 * Comment Service
 * Handles YouTube comment operations
 */
export class CommentService {
  /**
   * Get authenticated YouTube client
   */
  private static async getClient(userId: string): Promise<youtube_v3.Youtube> {
    const accessToken = await AuthService.getValidAccessToken(userId);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth });
  }

  /**
   * Fetch comments for a video
   */
  static async getComments(
    userId: string,
    videoId: string,
    pageToken?: string,
    maxResults: number = 20
  ): Promise<{ comments: CommentThread[]; nextPageToken?: string; userChannelId: string }> {
    try {
      const youtube = await this.getClient(userId);

      // Get user's channel ID to determine which comments can be deleted
      const channelResponse = await youtube.channels.list({
        part: ['id'],
        mine: true
      });
      const userChannelId = channelResponse.data.items?.[0]?.id || '';

      // Fetch comment threads
      const response = await youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        maxResults,
        pageToken,
        order: 'relevance'
      });

      const comments: CommentThread[] = response.data.items?.map(thread => {
        const topComment = thread.snippet?.topLevelComment?.snippet;
        const topCommentId = thread.snippet?.topLevelComment?.id || '';
        
        return {
          id: thread.id || '',
          topLevelComment: {
            id: topCommentId,
            authorDisplayName: topComment?.authorDisplayName || 'Unknown',
            authorProfileImageUrl: topComment?.authorProfileImageUrl || '',
            authorChannelId: topComment?.authorChannelId?.value || '',
            textDisplay: topComment?.textDisplay || '',
            textOriginal: topComment?.textOriginal || '',
            likeCount: topComment?.likeCount || 0,
            publishedAt: topComment?.publishedAt || '',
            updatedAt: topComment?.updatedAt || '',
            canDelete: topComment?.authorChannelId?.value === userChannelId
          },
          totalReplyCount: thread.snippet?.totalReplyCount || 0,
          replies: thread.replies?.comments?.map(reply => ({
            id: reply.id || '',
            authorDisplayName: reply.snippet?.authorDisplayName || 'Unknown',
            authorProfileImageUrl: reply.snippet?.authorProfileImageUrl || '',
            authorChannelId: reply.snippet?.authorChannelId?.value || '',
            textDisplay: reply.snippet?.textDisplay || '',
            textOriginal: reply.snippet?.textOriginal || '',
            likeCount: reply.snippet?.likeCount || 0,
            publishedAt: reply.snippet?.publishedAt || '',
            updatedAt: reply.snippet?.updatedAt || '',
            canDelete: reply.snippet?.authorChannelId?.value === userChannelId
          })) || []
        };
      }) || [];

      return {
        comments,
        nextPageToken: response.data.nextPageToken || undefined,
        userChannelId
      };
    } catch (error: any) {
      throw handleYouTubeQuotaError(error);
    }
  }

  /**
   * Add a new top-level comment to a video
   */
  static async addComment(
    userId: string,
    videoId: string,
    text: string
  ): Promise<CommentThread> {
    try {
      const youtube = await this.getClient(userId);

      const response = await youtube.commentThreads.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            videoId,
            topLevelComment: {
              snippet: {
                textOriginal: text
              }
            }
          }
        }
      });

      const thread = response.data;
      const topComment = thread.snippet?.topLevelComment?.snippet;

      // Log comment added event
      await EventService.log(EventType.COMMENT_ADDED, userId, {
        videoId,
        commentId: thread.id,
        textPreview: text.substring(0, 100)
      });

      return {
        id: thread.id || '',
        topLevelComment: {
          id: thread.snippet?.topLevelComment?.id || '',
          authorDisplayName: topComment?.authorDisplayName || 'You',
          authorProfileImageUrl: topComment?.authorProfileImageUrl || '',
          authorChannelId: topComment?.authorChannelId?.value || '',
          textDisplay: topComment?.textDisplay || text,
          textOriginal: topComment?.textOriginal || text,
          likeCount: 0,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canDelete: true
        },
        totalReplyCount: 0,
        replies: []
      };
    } catch (error: any) {
      throw handleYouTubeQuotaError(error);
    }
  }

  /**
   * Reply to an existing comment
   */
  static async replyToComment(
    userId: string,
    parentId: string,
    text: string
  ): Promise<Comment> {
    try {
      const youtube = await this.getClient(userId);

      const response = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId,
            textOriginal: text
          }
        }
      });

      const reply = response.data;
      const snippet = reply.snippet;

      // Log reply added event
      await EventService.log(EventType.REPLY_ADDED, userId, {
        parentCommentId: parentId,
        replyId: reply.id,
        textPreview: text.substring(0, 100)
      });

      return {
        id: reply.id || '',
        authorDisplayName: snippet?.authorDisplayName || 'You',
        authorProfileImageUrl: snippet?.authorProfileImageUrl || '',
        authorChannelId: snippet?.authorChannelId?.value || '',
        textDisplay: snippet?.textDisplay || text,
        textOriginal: snippet?.textOriginal || text,
        likeCount: 0,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canDelete: true
      };
    } catch (error: any) {
      throw handleYouTubeQuotaError(error);
    }
  }

  /**
   * Delete a comment (only if owned by authenticated user)
   */
  static async deleteComment(userId: string, commentId: string): Promise<void> {
    try {
      const youtube = await this.getClient(userId);

      // Verify ownership before deletion
      const commentResponse = await youtube.comments.list({
        part: ['snippet'],
        id: [commentId]
      });

      const comment = commentResponse.data.items?.[0];
      if (!comment) {
        throw new ApiError(404, 'Comment not found');
      }

      // Get user's channel to verify ownership
      const channelResponse = await youtube.channels.list({
        part: ['id'],
        mine: true
      });
      const userChannelId = channelResponse.data.items?.[0]?.id;

      if (comment.snippet?.authorChannelId?.value !== userChannelId) {
        throw new ApiError(403, 'You can only delete your own comments');
      }

      // Delete the comment
      await youtube.comments.delete({ id: commentId });

      // Log comment deleted event
      await EventService.log(EventType.COMMENT_DELETED, userId, {
        commentId
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw handleYouTubeQuotaError(error);
    }
  }
}

export default CommentService;

