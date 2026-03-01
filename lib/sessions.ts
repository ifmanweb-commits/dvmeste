import { cookies } from "next/headers";

export type ManagerSession = {
  id: string;
  email: string;
  fullName: string;
  permissions: {
    canManagePsychologists: boolean;
    canManageArticles: boolean;
    canManagePages: boolean;
    canManageManagers: boolean;
  };
  timestamp: number;
};

export async function getManagerSession(): Promise<ManagerSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("manager-session");
    
    if (!sessionCookie?.value) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value) as ManagerSession;
    
                                               
    const SESSION_DURATION = 24 * 60 * 60 * 1000;                           
    if (Date.now() - session.timestamp > SESSION_DURATION) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Ошибка чтения сессии:", error);
    return null;
  }
}

export async function setManagerSession(session: ManagerSession) {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: "manager-session",
      value: JSON.stringify(session),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60,           
    });
  } catch (error) {
    console.error("Ошибка установки сессии:", error);
  }
}

export async function clearManagerSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("manager-session");
  } catch (error) {
    console.error("Ошибка очистки сессии:", error);
  }
}