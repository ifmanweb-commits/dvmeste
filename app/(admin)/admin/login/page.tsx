import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, getValidSessionToken } from "@/lib/auth-admin";
import { authenticateSuperAdmin } from "@/lib/super-admin";

type SearchParams = {
  error?: string;
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const error = params.error === "1";

  const one = '1'
  const two = '2'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-foreground">Вход в админ-панель</h1>
        <p className="mt-2 text-sm text-neutral-dark">
          Супер-админ входит по логину или email и паролю.
        </p>

        <form action={loginAction} className="mt-8 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Неверный логин/email или пароль.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">Логин или email</label>
            <input
              type="text"
              name="identifier"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Пароль</label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#5858E2] py-3 font-medium text-white hover:bg-[#4848d0]"
          >
            Войти
          </button>
        </form>

        <div className="mt-4 text-right">
          <Link href="/admin/forgot-password" className="text-sm text-[#5858E2] hover:underline">
            Забыли пароль?
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link href="/auth/login" className="text-sm text-[#5858E2] hover:underline">
            Перейти к общей странице авторизации
          </Link>
        </div>
      </div>
    </div>
  );
}

async function loginAction(formData: FormData) {
  "use server";

  const identifier = (formData.get("identifier") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  let admin: Awaited<ReturnType<typeof authenticateSuperAdmin>> = null;
  try {
    admin = await authenticateSuperAdmin(identifier, password);
  } catch (error) {
    console.error("admin.login failed", error);
    redirect("/admin/login?error=1");
  }

  if (!admin) {
    redirect("/admin/login?error=1");
  }

  const token = getValidSessionToken();
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };

  cookieStore.set(COOKIE_NAME, token, cookieOptions);
  cookieStore.set("admin-session", token, cookieOptions);

  const authSession = {
    id: admin.id,
    email: admin.email,
    name: admin.login,
    role: "ADMIN",
    isActive: true,
    isDefaultAdmin: true,
    createdAt: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  cookieStore.set("auth-session", JSON.stringify(authSession), cookieOptions);

  redirect("/admin");
}
