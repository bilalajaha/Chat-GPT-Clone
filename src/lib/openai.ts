import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatCompletionRequest, ChatCompletionResponse, GeminiRequest, GeminiResponse } from '@/types';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Convert OpenAI format to Gemini format
function convertToGeminiFormat(request: ChatCompletionRequest): GeminiRequest {
  const contents = request.messages
    .filter(msg => msg.role !== 'system') // Gemini doesn't support system messages in the same way
    .map(msg => ({
      role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: msg.content }]
    }));

  return {
    contents,
    generationConfig: {
      temperature: request.temperature || 0.7,
      maxOutputTokens: request.max_tokens || 1000,
      topP: 0.8,
      topK: 40,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT' as any,
        threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH' as any,
        threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any,
        threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any,
        threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
      },
    ],
  };
}

// Convert Gemini response to OpenAI format
function convertFromGeminiFormat(geminiResponse: GeminiResponse, model: string): ChatCompletionResponse {
  const candidate = geminiResponse.candidates[0];
  const content = candidate?.content?.parts?.[0]?.text || '';
  
  return {
    id: `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: candidate?.finishReason || 'stop',
      },
    ],
    usage: {
      prompt_tokens: geminiResponse.usageMetadata.promptTokenCount,
      completion_tokens: geminiResponse.usageMetadata.candidatesTokenCount,
      total_tokens: geminiResponse.usageMetadata.totalTokenCount,
    },
  };
}

// Chat completion function
export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: request.model || 'gemini-1.5-flash',
    });
    
    const geminiRequest = convertToGeminiFormat(request);
    const result = await model.generateContent(geminiRequest as any);
    const response = await result.response;
    
    const geminiResponse: GeminiResponse = {
      candidates: [
        {
          content: {
            parts: (response.candidates?.[0]?.content?.parts || []) as { text: string }[],
            role: 'model',
          },
          finishReason: response.candidates?.[0]?.finishReason || 'STOP',
          index: 0,
          safetyRatings: response.candidates?.[0]?.safetyRatings || [],
        },
      ],
      usageMetadata: {
        promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
      },
    };

    return convertFromGeminiFormat(geminiResponse, request.model || 'gemini-pro');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get response from AI');
  }
}

// Streaming chat completion function
export async function* createStreamingChatCompletion(
  request: ChatCompletionRequest
): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: request.model || 'gemini-1.5-flash',
    });
    
    const geminiRequest = convertToGeminiFormat(request);
    const result = await model.generateContentStream(geminiRequest as any);
    
    for await (const chunk of result.stream) {
      const content = chunk.text();
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw new Error('Failed to get streaming response from AI');
  }
}

// Validate API key
export function validateApiKey(apiKey: string): boolean {
  return !!(apiKey && apiKey.length > 20);
}

// Get available models
export const AVAILABLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro-vision',
] as const;

export type ModelType = typeof AVAILABLE_MODELS[number];
