import { useState } from 'react';
import { aiApi, TitleSuggestion } from '../lib/api';
import { Sparkles, Loader2, Copy, Check, AlertCircle, Lightbulb } from 'lucide-react';

interface AISuggestionsProps {
  title: string;
  description: string;
  videoId?: string;
}

export default function AISuggestions({ title, description, videoId }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSuggest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await aiApi.suggestTitles({
        title,
        description,
        videoId
      });
      setSuggestions(response.data.suggestions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-violet" />
          AI Title Suggestions
        </h3>
      </div>

      {/* Current title info */}
      <div className="bg-midnight-900/50 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Title</p>
        <p className="text-gray-200 font-medium">{title}</p>
      </div>

      {/* Generate button */}
      <button
        onClick={handleSuggest}
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center gap-2 mb-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating suggestions...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Suggest Better Titles
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="bg-accent-coral/20 border border-accent-coral/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-coral flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-accent-coral font-medium">Failed to generate suggestions</p>
            <p className="text-sm text-accent-coral/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Click to copy any suggestion to clipboard
          </p>
          
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-midnight-900/80 to-midnight-800/50 rounded-xl p-4 border border-white/5 hover:border-accent-violet/30 transition-all group cursor-pointer"
              onClick={() => handleCopy(suggestion.title, index)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-accent-violet/20 text-accent-violet text-sm font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs text-gray-500">Suggestion</span>
                  </div>
                  <p className="text-white font-medium mb-3">{suggestion.title}</p>
                  <p className="text-sm text-gray-400">{suggestion.reason}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(suggestion.title, index);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-accent-teal" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-500 text-center mt-4">
            These are AI-generated suggestions. Review and edit before using.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && suggestions.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-violet/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent-violet/50" />
          </div>
          <p className="text-gray-400">
            Click the button above to generate AI-powered title suggestions
          </p>
          <p className="text-sm text-gray-500 mt-2">
            The AI will analyze your current title and description to create 3 optimized alternatives
          </p>
        </div>
      )}
    </div>
  );
}

