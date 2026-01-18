import { useState, useEffect } from 'react';
import { noteApi, Note } from '../lib/api';
import { 
  StickyNote, Plus, Save, Trash2, Edit2, X, Search,
  Loader2, Tag, AlertCircle 
} from 'lucide-react';

interface NotesSectionProps {
  videoId: string;
}

export default function NotesSection({ videoId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [videoId]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await noteApi.getNotesByVideo(videoId);
      setNotes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await noteApi.getTags();
      setAllTags(response.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleCreate = async () => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const response = await noteApi.createNote({
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        videoId
      });
      setNotes(prev => [response.data, ...prev]);
      resetForm();
      fetchTags(); // Refresh tags list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const response = await noteApi.updateNote(noteId, {
        content: content.trim(),
        tags
      });
      setNotes(prev => prev.map(n => n.id === noteId ? response.data : n));
      resetForm();
      fetchTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteApi.deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setContent(note.content);
    setTags(note.tags);
    setIsCreating(false);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setContent('');
    setTags([]);
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const NoteForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="bg-midnight-900/50 rounded-xl p-4 space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note..."
        className="textarea h-32"
        autoFocus
      />
      
      {/* Tags input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="tag flex items-center gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-accent-coral">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag..."
            className="input flex-1"
          />
          <button
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="btn-secondary text-sm px-4 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => isEdit ? handleUpdate(editingId!) : handleCreate()}
          disabled={!content.trim() || isSaving}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Update' : 'Save'}
            </>
          )}
        </button>
        <button onClick={resetForm} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-accent-amber" />
          Notes
        </h3>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="input pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="input w-full sm:w-48"
          >
            <option value="">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-accent-coral/20 border border-accent-coral/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-accent-coral" />
          <span className="text-accent-coral">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-accent-coral" />
          </button>
        </div>
      )}

      {/* Create form */}
      {isCreating && <NoteForm />}

      {/* Notes list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-midnight-500" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {notes.length === 0 
            ? 'No notes yet. Create your first note!'
            : 'No notes match your search.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div key={note.id}>
              {editingId === note.id ? (
                <NoteForm isEdit />
              ) : (
                <div className="bg-midnight-900/30 rounded-xl p-4 hover:bg-midnight-900/50 transition-colors">
                  <p className="text-gray-200 whitespace-pre-wrap mb-3">
                    {note.content}
                  </p>
                  
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {note.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`tag text-xs cursor-pointer ${selectedTag === tag ? 'tag-active' : ''}`}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(note.createdAt)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 hover:bg-accent-coral/20 rounded-lg transition-colors text-accent-coral/70 hover:text-accent-coral"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

