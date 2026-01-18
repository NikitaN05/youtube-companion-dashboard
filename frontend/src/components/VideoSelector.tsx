import { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { Search, Loader2 } from 'lucide-react';

export default function VideoSelector() {
  const { fetchVideoDetails, isLoading } = useVideoStore();
  const [videoId, setVideoId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId.trim()) return;

    // Extract video ID from URL if full URL is pasted
    let id = videoId.trim();
    
    // Handle various YouTube URL formats
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of urlPatterns) {
      const match = id.match(pattern);
      if (match) {
        id = match[1];
        break;
      }
    }

    try {
      await fetchVideoDetails(id);
      setVideoId('');
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-display font-semibold mb-4">Load Video</h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID or URL"
            className="input pl-12"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !videoId.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>Load Video</span>
          )}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Example: dQw4w9WgXcQ or https://youtube.com/watch?v=dQw4w9WgXcQ
      </p>
    </div>
  );
}

