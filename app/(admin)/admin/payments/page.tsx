import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { PaymentsClient } from './PaymentsClient';

export default async function PaymentsPage() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/auth/login');
  }

  return <PaymentsClient user={user} />;
}