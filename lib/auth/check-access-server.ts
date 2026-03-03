import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

/**
 * Для server actions — возвращает ошибку вместо редиректа
 */
export async function checkAdminAccess() {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new Error("Не авторизован");
  }
  
  const isAdmin = session.user.isAdmin === true;
  
  if (!isAdmin) {
    throw new Error("Недостаточно прав");
  }
  
  return session.user;
}

export async function checkManagerAccess() {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new Error("Не авторизован");
  }
  
  const isAdmin = session.user.isAdmin === true;
  const isManager = session.user.isManager === true;
  
  if (!isAdmin && !isManager) {
    throw new Error("Недостаточно прав");
  }
  
  return session.user;
}

export async function checkPsychologistAccess() {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new Error("Не авторизован");
  }
  
  const isPsychologist = session.user.isPsychologist === true;
  
  if (!isPsychologist) {
    throw new Error("Недостаточно прав");
  }
  
  return session.user;
}