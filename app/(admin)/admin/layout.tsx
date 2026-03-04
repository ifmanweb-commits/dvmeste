import { AdminLayoutInner } from "./AdminLayoutInner";
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export default async function AdminLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const user = await getCurrentUser()
  
  if (!user || (!user.isAdmin && !user.isManager)) {
    redirect('/auth/login')
  }
  
  return <AdminLayoutInner user={user}>{children}</AdminLayoutInner>
}