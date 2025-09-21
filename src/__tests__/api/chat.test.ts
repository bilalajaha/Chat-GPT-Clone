import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/chat/route';

// Mock the Gemini library
jest.mock('@/lib/gemini', () => ({
  createChatCompletion: jest.fn(),
  createStreamingChatCompletion: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST', () => {
    it('returns 400 for empty messages array', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Messages array is required and cannot be empty');
    });

    it('returns 400 for missing messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Messages array is required and cannot be empty');
    });

    it('returns 500 when API key is not configured', async () => {
      process.env.GEMINI_API_KEY = '';
      
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }] 
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Gemini API key is not configured');
    });

    it('calls createChatCompletion for non-streaming requests', async () => {
      const { createChatCompletion } = require('@/lib/gemini');
      const mockResponse = { content: 'Hello response' };
      createChatCompletion.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(createChatCompletion).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gemini-pro',
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      });
    });

    it('handles streaming requests', async () => {
      const { createStreamingChatCompletion } = require('@/lib/gemini');
      const mockStream = [
        'Hello',
        ' world',
        '!'
      ];
      
      createStreamingChatCompletion.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockStream) {
            yield chunk;
          }
        }
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('uses default parameters when not provided', async () => {
      const { createChatCompletion } = require('@/lib/gemini');
      createChatCompletion.mockResolvedValue({ content: 'Response' });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }]
        }),
      });

      await POST(request);

      expect(createChatCompletion).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gemini-pro',
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      });
    });

    it('uses custom parameters when provided', async () => {
      const { createChatCompletion } = require('@/lib/gemini');
      createChatCompletion.mockResolvedValue({ content: 'Response' });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-1.5-pro',
          temperature: 0.9,
          max_tokens: 2000
        }),
      });

      await POST(request);

      expect(createChatCompletion).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gemini-1.5-pro',
        temperature: 0.9,
        max_tokens: 2000,
        stream: false,
      });
    });

    it('handles API errors gracefully', async () => {
      const { createChatCompletion } = require('@/lib/gemini');
      createChatCompletion.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }]
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('handles streaming errors gracefully', async () => {
      const { createStreamingChatCompletion } = require('@/lib/gemini');
      
      createStreamingChatCompletion.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          throw new Error('Streaming Error');
        }
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true
        }),
      });

      const response = await POST(request);
      
      // The response should still be created, but the stream will error
      expect(response.status).toBe(200);
    });
  });

  describe('GET', () => {
    it('returns API status and available models', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Chat API endpoint is running');
      expect(data.models).toEqual([
        'gemini-pro',
        'gemini-pro-vision', 
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ]);
    });
  });
});
