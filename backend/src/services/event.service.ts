import prisma from '../config/prisma';

// Event types enum for consistency
export enum EventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  FETCH_VIDEO = 'fetch_video',
  UPDATE_VIDEO_METADATA = 'update_video_metadata',
  COMMENT_ADDED = 'comment_added',
  COMMENT_DELETED = 'comment_deleted',
  REPLY_ADDED = 'reply_added',
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  AI_TITLE_SUGGESTION = 'ai_title_suggestion'
}

interface EventMetadata {
  [key: string]: any;
}

// Helper to parse metadata from JSON string
const parseMetadata = (metadataJson: string | null): any => {
  if (!metadataJson) return null;
  try {
    return JSON.parse(metadataJson);
  } catch {
    return null;
  }
};

// Helper to format event with parsed metadata
const formatEvent = (event: any) => ({
  ...event,
  metadata: parseMetadata(event.metadata)
});

/**
 * Service for logging all application events
 * MANDATORY: All significant actions must be logged
 */
export class EventService {
  /**
   * Log an event to the database
   */
  static async log(
    eventType: EventType | string,
    userId: string | null,
    metadata?: EventMetadata
  ) {
    try {
      const event = await prisma.eventLog.create({
        data: {
          eventType,
          userId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          timestamp: new Date()
        }
      });
      return formatEvent(event);
    } catch (error) {
      // Log to console but don't throw - event logging shouldn't break the app
      console.error('Failed to log event:', error);
      return null;
    }
  }

  /**
   * Get events for a user with pagination
   */
  static async getUserEvents(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { page = 1, limit = 50, eventType, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (eventType) {
      where.eventType = eventType;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [events, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.eventLog.count({ where })
    ]);

    return {
      events: events.map(formatEvent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all events (admin function) with pagination
   */
  static async getAllEvents(
    options: {
      page?: number;
      limit?: number;
      eventType?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, eventType } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventType) {
      where.eventType = eventType;
    }

    const [events, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.eventLog.count({ where })
    ]);

    return {
      events: events.map(formatEvent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get event type statistics
   */
  static async getEventStats(userId?: string) {
    const where = userId ? { userId } : {};
    
    const stats = await prisma.eventLog.groupBy({
      by: ['eventType'],
      where,
      _count: {
        eventType: true
      }
    });

    return stats.map(s => ({
      eventType: s.eventType,
      count: s._count.eventType
    }));
  }
}

export default EventService;
