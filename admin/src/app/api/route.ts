import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'UP',
    service: 'Radio Ninada REST API Server',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
}
