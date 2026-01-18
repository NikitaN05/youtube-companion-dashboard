import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Youtube, Play, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-midnight-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl" />
      
      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card glass-strong animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-coral to-accent-coral/70 flex items-center justify-center shadow-lg shadow-accent-coral/30">
                <Youtube className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-accent-teal flex items-center justify-center">
                <Play className="w-4 h-4 text-midnight-950 fill-current" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-display font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            YouTube Dashboard
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Manage your videos, comments, and notes in one place
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-midnight-800/50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent-teal" />
              </div>
              <span>Secure Google OAuth authentication</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-midnight-800/50 flex items-center justify-center">
                <Youtube className="w-4 h-4 text-accent-coral" />
              </div>
              <span>Full YouTube Data API integration</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-midnight-800/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-amber" />
              </div>
              <span>AI-powered title suggestions</span>
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 bg-white text-midnight-950 font-semibold rounded-xl 
                     flex items-center justify-center gap-3 
                     hover:bg-gray-100 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-white/10"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-midnight-950/30 border-t-midnight-950 rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Scopes info */}
          <p className="text-xs text-gray-500 text-center mt-6">
            We'll request access to your YouTube account to manage videos and comments
          </p>
        </div>
      </div>
    </div>
  );
}

