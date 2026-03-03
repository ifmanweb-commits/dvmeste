import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export type UserRole = 'admin' | 'manager' | 'psychologist' | 'user';

/**
 * Получает текущую сессию и возвращает роли пользователя
 */
export async function getUserRoles() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      isManager: false,
      isPsychologist: false,
      userId: null,
      email: null,
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: session.user.isAdmin === true,
    isManager: session.user.isManager === true,
    isPsychologist: session.user.isPsychologist === true,
    userId: session.user.id,
    email: session.user.email,
  };
}

/**
 * Проверяет, что пользователь является администратором
 * Если нет — редиректит на главную админки (или на логин)
 */
export async function requireAdmin(redirectTo: string = '/admin') {
  const { isAuthenticated, isAdmin } = await getUserRoles();
  
  if (!isAuthenticated) {
    redirect('/auth/login');
  }
  
  if (!isAdmin) {
    redirect(redirectTo);
  }
  
  return true;
}

/**
 * Проверяет, что пользователь является администратором или менеджером
 * Если нет — редиректит на главную
 */
export async function requireManager(redirectTo: string = '/') {
  const { isAuthenticated, isAdmin, isManager } = await getUserRoles();
  
  if (!isAuthenticated) {
    redirect('/auth/login');
  }
  
  if (!isAdmin && !isManager) {
    redirect(redirectTo);
  }
  
  return true;
}

/**
 * Проверяет, что пользователь является психологом
 * Если нет — редиректит на главную
 */
export async function requirePsychologist(redirectTo: string = '/') {
  const { isAuthenticated, isPsychologist } = await getUserRoles();
  
  if (!isAuthenticated) {
    redirect('/auth/login');
  }
  
  if (!isPsychologist) {
    redirect(redirectTo);
  }
  
  return true;
}