import { NextRequest, NextResponse } from 'next/server';
import { proxyToLaravel, extractAuthToken, forwardHeaders } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  try {
    const authToken = extractAuthToken(request);
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';

    const result = await proxyToLaravel({
      method: 'GET',
      path: `/chats?page=${page}`,
      headers: forwardHeaders(request),
      authToken,
    });

    if (result.success) {
      return NextResponse.json(result.data, { status: result.status });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }
  } catch (error) {
    console.error('Get chats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = extractAuthToken(request);
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = await proxyToLaravel({
      method: 'POST',
      path: '/chats',
      body,
      headers: forwardHeaders(request),
      authToken,
    });

    if (result.success) {
      return NextResponse.json(result.data, { status: result.status });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }
  } catch (error) {
    console.error('Create chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
