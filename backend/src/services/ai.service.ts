import OpenAI from 'openai';
import EventService, { EventType } from './event.service';
import { ApiError } from '../middleware/errorHandler';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TitleSuggestion {
  title: string;
  reason: string;
}

/**
 * AI Service
 * Handles AI-powered features like title suggestions
 */
export class AIService {
  /**
   * Generate 3 improved title suggestions based on current title and description
   */
  static async suggestTitles(
    userId: string,
    currentTitle: string,
    description: string,
    videoId?: string
  ): Promise<TitleSuggestion[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError(500, 'OpenAI API key not configured');
    }

    try {
      const prompt = `You are a YouTube SEO expert. Based on the following video information, suggest exactly 3 improved titles that would perform better in terms of engagement, click-through rate, and searchability.

Current Title: "${currentTitle}"

Video Description:
${description || 'No description provided'}

Requirements for new titles:
1. Keep them under 60 characters for optimal display
2. Include relevant keywords naturally
3. Make them attention-grabbing but not clickbait
4. Maintain accuracy to the content
5. Each title should take a different approach (e.g., question-based, benefit-focused, curiosity-inducing)

Respond in JSON format with exactly 3 suggestions:
{
  "suggestions": [
    { "title": "First suggested title", "reason": "Brief explanation why this title works" },
    { "title": "Second suggested title", "reason": "Brief explanation why this title works" },
    { "title": "Third suggested title", "reason": "Brief explanation why this title works" }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert that provides JSON responses only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid AI response format');
      }

      const suggestions: TitleSuggestion[] = parsed.suggestions.slice(0, 3).map((s: any) => ({
        title: s.title || '',
        reason: s.reason || ''
      }));

      // Log AI suggestion event
      await EventService.log(EventType.AI_TITLE_SUGGESTION, userId, {
        videoId,
        currentTitle,
        suggestionsCount: suggestions.length,
        model: 'gpt-4o-mini'
      });

      return suggestions;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      
      // Handle OpenAI specific errors
      if (error?.status === 429) {
        throw new ApiError(429, 'AI rate limit exceeded. Please try again later.');
      }
      if (error?.status === 401) {
        throw new ApiError(500, 'Invalid OpenAI API key configuration');
      }
      
      console.error('AI Service Error:', error);
      throw new ApiError(500, 'Failed to generate title suggestions');
    }
  }

  /**
   * Alternative: Use Google's Gemini API for title suggestions
   * Uncomment and configure if using Gemini instead of OpenAI
   */
  // static async suggestTitlesWithGemini(
  //   userId: string,
  //   currentTitle: string,
  //   description: string,
  //   videoId?: string
  // ): Promise<TitleSuggestion[]> {
  //   // Implementation for Google Gemini API
  //   // const { GoogleGenerativeAI } = require('@google/generative-ai');
  //   // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  //   // ...
  // }
}

export default AIService;

