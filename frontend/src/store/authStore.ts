import { create } from 'zustand';
import { authApi, User } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },

  fetchUser: async () => {
    try {
      const response = await authApi.getCurrentUser();
      set({ user: response.data, isAuthenticated: true, error: null });
    } catch (error) {
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('token');
      throw error;
    }
  },

  login: async () => {
    try {
      const response = await authApi.getAuthUrl();
      window.location.href = response.data.url;
    } catch (error) {
      set({ error: 'Failed to initiate login' });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  initialize: async () => {
    const token = get().token;
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      await get().fetchUser();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Initialize auth state on app load
useAuthStore.getState().initialize();

