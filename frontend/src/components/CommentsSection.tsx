import { useState, useEffect } from 'react';
import { commentApi, CommentThread, Comment } from '../lib/api';
import { 
  MessageCircle, Send, Trash2, Reply, Loader2, 
  ChevronDown, ChevronUp, ThumbsUp, AlertCircle 
} from 'lucide-react';

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async (pageToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await commentApi.getComments(videoId, pageToken);
      
      if (pageToken) {
        setComments(prev => [...prev, ...response.data.comments]);
      } else {
        setComments(response.data.comments);
      }
      setNextPageToken(response.data.nextPageToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await commentApi.addComment(videoId, newComment);
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await commentApi.replyToComment(commentId, replyText);
      
      // Add reply to the comment thread
      setComments(prev => prev.map(thread => {
        if (thread.id === commentId || thread.topLevelComment.id === commentId) {
          return {
            ...thread,
            replies: [...thread.replies, response.data],
            totalReplyCount: thread.totalReplyCount + 1
          };
        }
        return thread;
      }));
      
      setReplyText('');
      setReplyingTo(null);
      
      // Auto-expand replies
      setExpandedReplies(prev => new Set(prev).add(commentId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentApi.deleteComment(commentId);
      
      // Remove comment or reply from state
      setComments(prev => prev
        .filter(thread => thread.topLevelComment.id !== commentId)
        .map(thread => ({
          ...thread,
          replies: thread.replies.filter(reply => reply.id !== commentId)
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const toggleReplies = (threadId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <img
        src={comment.authorProfileImageUrl || '/default-avatar.png'}
        alt={comment.authorDisplayName}
        className="w-10 h-10 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.authorDisplayName}</span>
          <span className="text-xs text-gray-500">{formatDate(comment.publishedAt)}</span>
        </div>
        <p 
          className="text-sm text-gray-300 whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: comment.textDisplay }}
        />
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <ThumbsUp className="w-3.5 h-3.5" />
            {comment.likeCount}
          </span>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {comment.canDelete && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-xs text-accent-coral/70 hover:text-accent-coral transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <h3 className="font-display font-semibold flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-accent-amber" />
        Comments
      </h3>

      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="textarea flex-1 h-20"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="btn-primary self-end flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="bg-accent-coral/20 border border-accent-coral/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-accent-coral" />
          <span className="text-accent-coral">{error}</span>
        </div>
      )}

      {/* Comments list */}
      {isLoading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-midnight-500" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((thread) => (
            <div key={thread.id} className="space-y-4">
              <CommentItem comment={thread.topLevelComment} />
              
              {/* Reply form */}
              {replyingTo === thread.topLevelComment.id && (
                <div className="ml-12 flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="textarea flex-1 h-16"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleReply(thread.topLevelComment.id)}
                      disabled={!replyText.trim() || isSubmitting}
                      className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Replies toggle */}
              {thread.totalReplyCount > 0 && (
                <button
                  onClick={() => toggleReplies(thread.id)}
                  className="ml-12 text-sm text-midnight-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {expandedReplies.has(thread.id) ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide {thread.totalReplyCount} {thread.totalReplyCount === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {thread.totalReplyCount} {thread.totalReplyCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
              
              {/* Replies list */}
              {expandedReplies.has(thread.id) && thread.replies.length > 0 && (
                <div className="space-y-4">
                  {thread.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Load more */}
          {nextPageToken && (
            <button
              onClick={() => fetchComments(nextPageToken)}
              disabled={isLoading}
              className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Load more comments'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

