'use server';

import { removeSession } from './session';
import { redirect } from 'next/navigation';

export async function logout() {
  console.log('🚪 Logout started');
  
  // Используем существующий метод removeSession
  await removeSession();
  
  console.log('🔄 Redirecting to login');
  redirect('/auth/login');
}