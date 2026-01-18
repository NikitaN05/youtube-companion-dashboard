import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { Youtube, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-coral to-accent-coral/70 flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block">
                YouTube Dashboard
              </span>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="w-9 h-9 rounded-full ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-midnight-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            YouTube Video Management Dashboard • Built with React + Express
          </p>
        </div>
      </footer>
    </div>
  );
}

