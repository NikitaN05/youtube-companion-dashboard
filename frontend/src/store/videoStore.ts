import { create } from 'zustand';
import { videoApi, Video } from '../lib/api';

interface VideoState {
  currentVideo: Video | null;
  userVideos: Video[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVideoDetails: (videoId: string) => Promise<void>;
  updateVideoMetadata: (videoId: string, data: { title?: string; description?: string }) => Promise<void>;
  fetchUserVideos: () => Promise<void>;
  setCurrentVideo: (video: Video | null) => void;
  clearError: () => void;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  currentVideo: null,
  userVideos: [],
  isLoading: false,
  error: null,

  fetchVideoDetails: async (videoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.getVideoDetails(videoId);
      set({ currentVideo: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch video details',
        isLoading: false 
      });
      throw error;
    }
  },

  updateVideoMetadata: async (videoId: string, data: { title?: string; description?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.updateMetadata(videoId, data);
      set({ currentVideo: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update video',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchUserVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.getUserVideos(20);
      set({ userVideos: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch videos',
        isLoading: false 
      });
    }
  },

  setCurrentVideo: (video: Video | null) => {
    set({ currentVideo: video });
  },

  clearError: () => {
    set({ error: null });
  },
}));

