import { Video } from '../lib/api';
import { Eye, ThumbsUp, MessageCircle, Calendar, Lock, Globe, EyeOff } from 'lucide-react';

interface VideoDetailsProps {
  video: Video;
}

export default function VideoDetails({ video }: VideoDetailsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPrivacyIcon = () => {
    switch (video.privacyStatus) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'unlisted':
      default:
        return <EyeOff className="w-4 h-4" />;
    }
  };

  const getPrivacyLabel = () => {
    return video.privacyStatus.charAt(0).toUpperCase() + video.privacyStatus.slice(1);
  };

  return (
    <div className="card">
      {/* Thumbnail */}
      {video.thumbnailUrl && (
        <div className="relative mb-4 rounded-xl overflow-hidden group">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 to-transparent" />
          
          {/* Privacy badge */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg glass text-xs font-medium flex items-center gap-1.5">
            {getPrivacyIcon()}
            {getPrivacyLabel()}
          </div>
        </div>
      )}

      {/* Title */}
      <h2 className="font-display font-semibold text-lg mb-2 line-clamp-2">
        {video.title}
      </h2>

      {/* Video ID */}
      <p className="text-xs text-gray-500 font-mono mb-4">
        ID: {video.youtubeVideoId}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-midnight-900/50 rounded-xl p-3 text-center">
          <Eye className="w-5 h-5 mx-auto mb-1 text-accent-teal" />
          <p className="text-lg font-semibold">{formatNumber(video.viewCount)}</p>
          <p className="text-xs text-gray-500">Views</p>
        </div>
        <div className="bg-midnight-900/50 rounded-xl p-3 text-center">
          <ThumbsUp className="w-5 h-5 mx-auto mb-1 text-accent-coral" />
          <p className="text-lg font-semibold">{formatNumber(video.likeCount)}</p>
          <p className="text-xs text-gray-500">Likes</p>
        </div>
        <div className="bg-midnight-900/50 rounded-xl p-3 text-center">
          <MessageCircle className="w-5 h-5 mx-auto mb-1 text-accent-amber" />
          <p className="text-lg font-semibold">{formatNumber(video.commentCount)}</p>
          <p className="text-xs text-gray-500">Comments</p>
        </div>
      </div>

      {/* Published date */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
        <Calendar className="w-4 h-4" />
        <span>Published {formatDate(video.publishedAt)}</span>
      </div>
    </div>
  );
}

