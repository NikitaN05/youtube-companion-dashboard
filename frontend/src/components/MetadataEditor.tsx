import { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { Video } from '../lib/api';
import { Save, RotateCcw, Loader2, Edit3 } from 'lucide-react';

interface MetadataEditorProps {
  video: Video;
}

export default function MetadataEditor({ video }: MetadataEditorProps) {
  const { updateVideoMetadata, isLoading } = useVideoStore();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when video changes
  useEffect(() => {
    setTitle(video.title);
    setDescription(video.description || '');
    setIsEditing(false);
  }, [video]);

  const hasChanges = title !== video.title || description !== (video.description || '');

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const updates: { title?: string; description?: string } = {};
      if (title !== video.title) updates.title = title;
      if (description !== (video.description || '')) updates.description = description;
      
      await updateVideoMetadata(video.youtubeVideoId, updates);
      setIsEditing(false);
    } catch (error) {
      // Error handled in store
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTitle(video.title);
    setDescription(video.description || '');
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-accent-violet" />
          Edit Metadata
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-midnight-400 hover:text-white transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Enter video title"
              maxLength={100}
            />
          ) : (
            <p className="text-gray-200 bg-midnight-900/30 rounded-xl px-4 py-3">
              {video.title}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea h-32"
              placeholder="Enter video description"
              maxLength={5000}
            />
          ) : (
            <p className="text-gray-200 bg-midnight-900/30 rounded-xl px-4 py-3 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {video.description || 'No description'}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">{description.length}/5000 characters</p>
          )}
        </div>

        {/* Action buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        )}

        {isEditing && (
          <button
            onClick={() => {
              handleReset();
              setIsEditing(false);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

