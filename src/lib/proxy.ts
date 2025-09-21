// Proxy utility for Laravel backend API calls
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

interface ProxyOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  authToken?: string;
}

export async function proxyToLaravel(options: ProxyOptions) {
  const { method, path, body, headers = {}, authToken } = options;
  
  const url = `${LARAVEL_API_URL}${path}`;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

// Helper function to extract auth token from request
export function extractAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper function to forward headers
export function forwardHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Forward relevant headers
  const headersToForward = [
    'user-agent',
    'accept-language',
    'x-forwarded-for',
    'x-real-ip',
  ];

  headersToForward.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  return headers;
}
