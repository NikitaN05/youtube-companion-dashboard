import { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import VideoSelector from '../components/VideoSelector';
import VideoDetails from '../components/VideoDetails';
import MetadataEditor from '../components/MetadataEditor';
import CommentsSection from '../components/CommentsSection';
import NotesSection from '../components/NotesSection';
import AISuggestions from '../components/AISuggestions';
import { Video, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { currentVideo, error, clearError } = useVideoStore();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'notes' | 'ai'>('details');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error banner */}
      {error && (
        <div className="bg-accent-coral/20 border border-accent-coral/30 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-accent-coral flex-shrink-0" />
          <p className="text-accent-coral">{error}</p>
        </div>
      )}

      {/* Video selector */}
      <VideoSelector />

      {/* Main content */}
      {currentVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Video details */}
          <div className="lg:col-span-1 space-y-6">
            <VideoDetails video={currentVideo} />
            <MetadataEditor video={currentVideo} />
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            {/* Tab navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'details', label: 'Comments' },
                { id: 'notes', label: 'Notes' },
                { id: 'ai', label: 'AI Suggestions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-midnight-600 text-white shadow-lg shadow-midnight-900/50'
                      : 'glass text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in">
              {activeTab === 'details' && (
                <CommentsSection videoId={currentVideo.youtubeVideoId} />
              )}
              {activeTab === 'notes' && (
                <NotesSection videoId={currentVideo.id} />
              )}
              {activeTab === 'ai' && (
                <AISuggestions
                  title={currentVideo.title}
                  description={currentVideo.description || ''}
                  videoId={currentVideo.youtubeVideoId}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="card glass-strong text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-midnight-800/50 flex items-center justify-center">
            <Video className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-display font-semibold mb-2">No Video Selected</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Enter a YouTube video ID above to view details, manage comments, and add notes
          </p>
        </div>
      )}
    </div>
  );
}

