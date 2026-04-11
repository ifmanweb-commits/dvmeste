import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { WithdrawalRequestsClient } from './WithdrawalRequestsClient';

export default async function WithdrawalRequestsPage() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/auth/login');
  }

  return <WithdrawalRequestsClient user={user} />;
}