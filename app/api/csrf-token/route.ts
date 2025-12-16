import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, addCSRFHeaders } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  // Generate new CSRF token
  const token = generateCSRFToken();

  // Create response
  const response = NextResponse.json({
    success: true,
    message: 'CSRF token generated'
  });

  // Add CSRF token to headers and set cookie
  addCSRFHeaders(response, token);
  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better mobile browser compatibility
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });

  return response;
}