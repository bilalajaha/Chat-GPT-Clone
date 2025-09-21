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
      path: '/user/preferences',
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
    console.error('Get preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      method: 'PUT',
      path: '/user/preferences',
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
    console.error('Update preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
