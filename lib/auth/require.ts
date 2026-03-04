import { getCurrentUser } from './session'
import { redirect } from 'next/navigation'

export async function requireUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

export async function requirePsychologist() {
  const user = await requireUser()
  
  // Проверяем, что это психолог (статус не PENDING)
  if (user.status === 'PENDING') {
    redirect('/account')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  
  if (!user.isAdmin && !user.isManager) {
    redirect('/')
  }
  
  return user
}