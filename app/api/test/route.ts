import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Test API: Received request');

    const body = await request.json();
    console.log('Test API: Body:', JSON.stringify(body, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Test API working',
      received: body
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: error.message || 'Test API failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test API GET working',
    timestamp: new Date().toISOString()
  });
}