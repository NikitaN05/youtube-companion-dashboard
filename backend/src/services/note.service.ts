import prisma from '../config/prisma';
import EventService, { EventType } from './event.service';
import { ApiError } from '../middleware/errorHandler';

interface CreateNoteInput {
  content: string;
  tags?: string[];
  videoId: string;
}

interface UpdateNoteInput {
  content?: string;
  tags?: string[];
}

interface NoteSearchParams {
  keyword?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

/**
 * Note Service
 * Handles CRUD operations for video notes
 */
export class NoteService {
  /**
   * Create a new note
   */
  static async createNote(userId: string, input: CreateNoteInput) {
    // Verify video exists in database
    const video = await prisma.video.findFirst({
      where: {
        id: input.videoId,
        userId
      }
    });

    if (!video) {
      throw new ApiError(404, 'Video not found');
    }

    const note = await prisma.note.create({
      data: {
        content: input.content,
        tags: input.tags || [],
        videoId: input.videoId,
        userId
      }
    });

    // Log note created event
    await EventService.log(EventType.NOTE_CREATED, userId, {
      noteId: note.id,
      videoId: input.videoId,
      tags: input.tags
    });

    return note;
  }

  /**
   * Get all notes for a video
   */
  static async getNotesByVideo(userId: string, videoId: string) {
    const notes = await prisma.note.findMany({
      where: {
        videoId,
        userId
      },
      orderBy: { createdAt: 'desc' }
    });

    return notes;
  }

  /**
   * Get all notes for a user with optional search/filter
   */
  static async getUserNotes(userId: string, params: NoteSearchParams = {}) {
    const { keyword, tag, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    // Keyword search in content
    if (keyword) {
      where.content = {
        contains: keyword,
        mode: 'insensitive'
      };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        has: tag
      };
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              youtubeVideoId: true,
              title: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.note.count({ where })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single note by ID
   */
  static async getNoteById(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      },
      include: {
        video: {
          select: {
            id: true,
            youtubeVideoId: true,
            title: true,
            thumbnailUrl: true
          }
        }
      }
    });

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    return note;
  }

  /**
   * Update a note
   */
  static async updateNote(userId: string, noteId: string, input: UpdateNoteInput) {
    // Verify note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      }
    });

    if (!existingNote) {
      throw new ApiError(404, 'Note not found');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.tags !== undefined && { tags: input.tags })
      }
    });

    // Log note updated event
    await EventService.log(EventType.NOTE_UPDATED, userId, {
      noteId,
      updatedFields: Object.keys(input)
    });

    return updatedNote;
  }

  /**
   * Delete a note
   */
  static async deleteNote(userId: string, noteId: string) {
    // Verify note exists and belongs to user
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      }
    });

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    await prisma.note.delete({
      where: { id: noteId }
    });

    // Log note deleted event
    await EventService.log(EventType.NOTE_DELETED, userId, {
      noteId
    });

    return { success: true };
  }

  /**
   * Get all unique tags for a user
   */
  static async getUserTags(userId: string) {
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { tags: true }
    });

    // Flatten and deduplicate tags
    const allTags = notes.flatMap(note => note.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  }

  /**
   * Search notes by keyword across content
   */
  static async searchNotes(userId: string, keyword: string) {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        content: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      include: {
        video: {
          select: {
            id: true,
            youtubeVideoId: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return notes;
  }
}

export default NoteService;

