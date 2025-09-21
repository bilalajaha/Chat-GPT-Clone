import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, createStreamingChatCompletion } from '@/lib/openai';
import { ChatCompletionRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, temperature, max_tokens, stream, chatId } = body as ChatCompletionRequest & { chatId?: string };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const chatRequest: ChatCompletionRequest = {
      messages,
      model: model || 'gemini-1.5-flash',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      stream: stream || false,
    };

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of createStreamingChatCompletion(chatRequest)) {
              const data = JSON.stringify({ content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle regular response
      const response = await createChatCompletion(chatRequest);
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Chat API endpoint is running',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision']
  });
}
