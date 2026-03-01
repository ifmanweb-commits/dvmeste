import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  for (const name of [
    'auth-session',
    'admin_session',
    'admin-session',
    'manager_session',
    'manager-session',
  ]) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }
  
  return response;
}
