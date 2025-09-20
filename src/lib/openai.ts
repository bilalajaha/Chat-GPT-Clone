import OpenAI from 'openai';
import { ChatCompletionRequest, ChatCompletionResponse } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Only for client-side usage
});

// Chat completion function
export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: request.model || 'gpt-3.5-turbo',
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: request.stream || false,
    });

    return response as ChatCompletionResponse;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to get response from AI');
  }
}

// Streaming chat completion function
export async function* createStreamingChatCompletion(
  request: ChatCompletionRequest
): AsyncGenerator<string, void, unknown> {
  try {
    const stream = await openai.chat.completions.create({
      model: request.model || 'gpt-3.5-turbo',
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('OpenAI Streaming Error:', error);
    throw new Error('Failed to get streaming response from AI');
  }
}

// Validate API key
export function validateApiKey(apiKey: string): boolean {
  return apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
}

// Get available models
export const AVAILABLE_MODELS = [
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4',
  'gpt-4-turbo-preview',
] as const;

export type ModelType = typeof AVAILABLE_MODELS[number];
