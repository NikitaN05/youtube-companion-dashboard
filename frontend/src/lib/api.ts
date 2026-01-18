import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  channelId: string | null;
  createdAt: string;
}

export interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  privacyStatus: string;
}

export interface Comment {
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
}

export interface CommentThread {
  id: string;
  topLevelComment: Comment;
  totalReplyCount: number;
  replies: Comment[];
}

export interface Note {
  id: string;
  content: string;
  tags: string[];
  videoId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  video?: {
    id: string;
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string | null;
  };
}

export interface TitleSuggestion {
  title: string;
  reason: string;
}

export interface EventLog {
  id: string;
  eventType: string;
  metadata: Record<string, any>;
  userId: string | null;
  timestamp: string;
}

// Auth API
export const authApi = {
  getAuthUrl: () => api.get<{ url: string }>('/auth/url'),
  getCurrentUser: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get<{ valid: boolean; user: User }>('/auth/verify'),
};

// Video API
export const videoApi = {
  getVideoDetails: (videoId: string) => api.get<Video>(`/videos/${videoId}`),
  updateMetadata: (videoId: string, data: { title?: string; description?: string }) =>
    api.put<Video>(`/videos/${videoId}`, data),
  getUserVideos: (maxResults = 10) => api.get<Video[]>(`/videos/user/list?maxResults=${maxResults}`),
};

// Comment API
export const commentApi = {
  getComments: (videoId: string, pageToken?: string) =>
    api.get<{ comments: CommentThread[]; nextPageToken?: string; userChannelId: string }>(
      `/comments/${videoId}${pageToken ? `?pageToken=${pageToken}` : ''}`
    ),
  addComment: (videoId: string, text: string) =>
    api.post<CommentThread>(`/comments/${videoId}`, { text }),
  replyToComment: (commentId: string, text: string) =>
    api.post<Comment>(`/comments/${commentId}/reply`, { text }),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Note API
export const noteApi = {
  getNotes: (params?: { keyword?: string; tag?: string; page?: number; limit?: number }) =>
    api.get<{ notes: Note[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/notes',
      { params }
    ),
  getNotesByVideo: (videoId: string) => api.get<Note[]>(`/notes/video/${videoId}`),
  getNote: (noteId: string) => api.get<Note>(`/notes/${noteId}`),
  createNote: (data: { content: string; tags?: string[]; videoId: string }) =>
    api.post<Note>('/notes', data),
  updateNote: (noteId: string, data: { content?: string; tags?: string[] }) =>
    api.put<Note>(`/notes/${noteId}`, data),
  deleteNote: (noteId: string) => api.delete(`/notes/${noteId}`),
  getTags: () => api.get<string[]>('/notes/tags/all'),
  searchNotes: (query: string) => api.get<Note[]>(`/notes/search?q=${encodeURIComponent(query)}`),
};

// AI API
export const aiApi = {
  suggestTitles: (data: { title: string; description: string; videoId?: string }) =>
    api.post<{ currentTitle: string; suggestions: TitleSuggestion[] }>('/ai/suggest-titles', data),
};

// Event API
export const eventApi = {
  getEvents: (params?: { page?: number; limit?: number; eventType?: string }) =>
    api.get<{ events: EventLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/events',
      { params }
    ),
  getStats: () => api.get<{ eventType: string; count: number }[]>('/events/stats'),
};

export default api;

