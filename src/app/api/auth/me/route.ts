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

    const result = await proxyToLaravel({
      method: 'GET',
      path: '/auth/me',
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
    console.error('Me API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
