import "server-only";

const COOKIE_NAME = "admin_session";

export function getValidSessionToken(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev_admin_session_change_me";
}

export function isSessionValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === getValidSessionToken();
}

export { COOKIE_NAME };
