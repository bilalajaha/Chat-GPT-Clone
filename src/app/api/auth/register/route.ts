import { NextRequest, NextResponse } from 'next/server';
import { proxyToLaravel, forwardHeaders } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await proxyToLaravel({
      method: 'POST',
      path: '/auth/register',
      body,
      headers: forwardHeaders(request),
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
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
