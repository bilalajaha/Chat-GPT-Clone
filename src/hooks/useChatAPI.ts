import { useState, useCallback } from 'react';
import { ChatCompletionRequest, ChatCompletionResponse } from '@/types';

interface UseChatAPIReturn {
  sendMessage: (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }) => Promise<ChatCompletionResponse>;
  sendStreamingMessage: (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) => AsyncGenerator<string, void, unknown>;
  isLoading: boolean;
  error: string | null;
}

export function useChatAPI(): UseChatAPIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<ChatCompletionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatCompletionRequest = {
        messages,
        model: options.model || 'gemini-pro',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: false,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendStreamingMessage = useCallback(async function* (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatCompletionRequest = {
        messages,
        model: options.model || 'gemini-pro',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: true,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  yield parsed.content;
                }
              } catch (e) {
                // Ignore parsing errors for malformed chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    sendStreamingMessage,
    isLoading,
    error,
  };
}
