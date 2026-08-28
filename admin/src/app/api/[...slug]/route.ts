import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-five-pearl-12.vercel.app/api';

async function proxyRequest(request: NextRequest, endpoint: string, method: string) {
  try {
    const targetUrl = `${BACKEND_API_URL.replace(/\/$/, '')}/${endpoint}`;
    const headers: Record<string, string> = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const contentType = request.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;

    let body: string | undefined = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch (_) {}
    }

    const res = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error(`[Admin API Proxy Error ${method} /api/${endpoint}]:`, error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || 'API Proxy Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug.join('/'), 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug.join('/'), 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug.join('/'), 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug.join('/'), 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug.join('/'), 'DELETE');
}
