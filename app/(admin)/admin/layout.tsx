import { AdminLayoutInner } from "./AdminLayoutInner";
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { getSiteMenuItems } from '@/lib/site-menu'

export default async function AdminLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const user = await getCurrentUser()
  const menuItems = await getSiteMenuItems()
  
  if (!user || (!user.isAdmin && !user.isManager)) {
    redirect('/auth/login')
  }
  
  return <AdminLayoutInner user={user} menuItems={menuItems}>{children}</AdminLayoutInner>
}
