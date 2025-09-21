import { renderHook, act } from '@testing-library/react';
import { useChatAPI } from '@/hooks/useChatAPI';

// Mock fetch
global.fetch = jest.fn();

// Mock TextEncoder and TextDecoder for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('useChatAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('sendMessage', () => {
    it('sends a message successfully', async () => {
      const mockResponse = { content: 'Hello response' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        const response = await result.current.sendMessage([
          { role: 'user', content: 'Hello' }
        ]);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro',
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      });
    });

    it('uses custom options when provided', async () => {
      const mockResponse = { content: 'Custom response' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        await result.current.sendMessage(
          [{ role: 'user', content: 'Hello' }],
          {
            model: 'gemini-1.5-pro',
            temperature: 0.9,
            max_tokens: 2000,
          }
        );
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-1.5-pro',
          temperature: 0.9,
          max_tokens: 2000,
          stream: false,
        }),
      });
    });

    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        await expect(
          result.current.sendMessage([{ role: 'user', content: 'Hello' }])
        ).rejects.toThrow('API Error');
      });

      expect(result.current.error).toBe('API Error');
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        await expect(
          result.current.sendMessage([{ role: 'user', content: 'Hello' }])
        ).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('sets loading state correctly', async () => {
      const mockResponse = { content: 'Hello response' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useChatAPI());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const promise = result.current.sendMessage([{ role: 'user', content: 'Hello' }]);
        expect(result.current.isLoading).toBe(true);
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('sendStreamingMessage', () => {
    it('sends a streaming message successfully', async () => {
      const mockChunks = ['Hello', ' world', '!'];
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Hello"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":" world"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"!"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: jest.fn(),
          }),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChatAPI());

      const chunks: string[] = [];
      await act(async () => {
        const generator = result.current.sendStreamingMessage([
          { role: 'user', content: 'Hello' }
        ]);
        
        for await (const chunk of generator) {
          chunks.push(chunk);
        }
      });

      expect(chunks).toEqual(['Hello', ' world', '!']);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro',
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        }),
      });
    });

    it('handles streaming errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Streaming error' }),
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        await expect(
          (async () => {
            const generator = result.current.sendStreamingMessage([
              { role: 'user', content: 'Hello' }
            ]);
            
            for await (const chunk of generator) {
              // This should not be reached
            }
          })()
        ).rejects.toThrow('Streaming error');
      });

      expect(result.current.error).toBe('Streaming error');
    });

    it('handles missing response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        await expect(
          (async () => {
            const generator = result.current.sendStreamingMessage([
              { role: 'user', content: 'Hello' }
            ]);
            
            for await (const chunk of generator) {
              // This should not be reached
            }
          })()
        ).rejects.toThrow('No response body');
      });
    });

    it('handles malformed streaming data gracefully', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Hello"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: invalid json\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: jest.fn(),
          }),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChatAPI());

      const chunks: string[] = [];
      await act(async () => {
        const generator = result.current.sendStreamingMessage([
          { role: 'user', content: 'Hello' }
        ]);
        
        for await (const chunk of generator) {
          chunks.push(chunk);
        }
      });

      // Should only include valid chunks
      expect(chunks).toEqual(['Hello']);
    });

    it('sets loading state correctly for streaming', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: jest.fn(),
          }),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChatAPI());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const generator = result.current.sendStreamingMessage([
          { role: 'user', content: 'Hello' }
        ]);
        
        expect(result.current.isLoading).toBe(true);
        
        for await (const chunk of generator) {
          // Process chunks
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('uses custom options for streaming', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: jest.fn(),
          }),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        const generator = result.current.sendStreamingMessage(
          [{ role: 'user', content: 'Hello' }],
          {
            model: 'gemini-1.5-pro',
            temperature: 0.9,
            max_tokens: 2000,
          }
        );
        
        for await (const chunk of generator) {
          // Process chunks
        }
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-1.5-pro',
          temperature: 0.9,
          max_tokens: 2000,
          stream: true,
        }),
      });
    });
  });

  describe('error handling', () => {
    it('clears error when new request is made', async () => {
      // First request fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'First error' }),
      });

      const { result } = renderHook(() => useChatAPI());

      await act(async () => {
        try {
          await result.current.sendMessage([{ role: 'user', content: 'Hello' }]);
        } catch (e) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBe('First error');

      // Second request succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Success' }),
      });

      await act(async () => {
        await result.current.sendMessage([{ role: 'user', content: 'Hello' }]);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('state management', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useChatAPI());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.sendStreamingMessage).toBe('function');
    });
  });
});
