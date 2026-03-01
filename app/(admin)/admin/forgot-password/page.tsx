import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  resetSuperAdminPasswordByTicket,
  requestSuperAdminPasswordResetByEmail,
  verifySuperAdminPasswordResetCode,
} from "@/lib/super-admin";

type SearchParams = {
  status?: string;
  step?: string;
  reason?: string;
};

const ADMIN_RESET_TICKET_COOKIE = "admin-reset-ticket";
const ADMIN_RESET_PENDING_EMAIL_COOKIE = "admin-reset-pending-email";

function resolveStatusMessage(status: string | undefined, reason?: string) {
  if (status === "sent") return { type: "success" as const, text: "Код отправлен на email супер-админа. Введите его ниже." };
  if (status === "verified") return { type: "success" as const, text: "Код подтвержден. Установите новый пароль." };
  if (status === "code") return { type: "error" as const, text: "Неверный или просроченный код." };
  if (status === "done") return { type: "success" as const, text: "Пароль обновлен. Можно войти в админку." };
  if (status === "mismatch") return { type: "error" as const, text: "Новый пароль и подтверждение не совпадают." };
  if (status === "input") return { type: "error" as const, text: "Заполните все поля." };
  if (status === "email") return { type: "error" as const, text: "Укажите email из профиля супер-админа." };
  if (status === "invalid") return { type: "error" as const, text: "Сессия восстановления недействительна. Начните заново." };
  if (status === "mail") {
    const details = reason ? ` Причина: ${decodeURIComponent(reason)}` : "";
    return { type: "error" as const, text: `Не удалось отправить письмо через UniSender.${details}` };
  }
  return null;
}

export default async function AdminForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const message = resolveStatusMessage(params.status, params.reason);
  const cookieStore = await cookies();
  const hasResetTicket = Boolean(cookieStore.get(ADMIN_RESET_TICKET_COOKIE)?.value);
  const hasPendingEmail = Boolean(cookieStore.get(ADMIN_RESET_PENDING_EMAIL_COOKIE)?.value);
  const isCodeStep = params.step === "code" && hasPendingEmail;
  const isResetStep = params.step === "reset" && hasResetTicket;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-foreground">Восстановление доступа</h1>
        <p className="mt-2 text-sm text-neutral-dark">
          Код отправляется на email супер-админа, который указан в профиле.
        </p>
        <p className="mt-2 text-xs text-[#8b5e00]">
          Email отправителя должен быть подтвержден в UniSender.
        </p>

        {message && (
          <p
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}

        {isResetStep ? (
          <form action={applyNewPasswordAction} className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-[#F8F9FF] p-4">
            <h2 className="text-sm font-semibold text-foreground">3. Новый пароль</h2>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              placeholder="Новый пароль"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground"
            />
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Подтверждение пароля"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-[#5858E2]/25 bg-white px-3 py-2 text-sm font-medium text-[#5858E2] hover:bg-[#5858E2]/5"
            >
              Сохранить новый пароль
            </button>
          </form>
        ) : isCodeStep ? (
          <form action={verifyCodeAction} className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-[#F8F9FF] p-4">
            <h2 className="text-sm font-semibold text-foreground">2. Подтвердите код из письма</h2>
            <input
              type="text"
              name="code"
              required
              maxLength={6}
              placeholder="6-значный код"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-[#5858E2]/25 bg-white px-3 py-2 text-sm font-medium text-[#5858E2] hover:bg-[#5858E2]/5"
            >
              Проверить код
            </button>
          </form>
        ) : (
          <form action={requestResetAction} className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-[#F8F9FF] p-4">
            <h2 className="text-sm font-semibold text-foreground">1. Подтверждение email</h2>
            <input
              type="email"
              name="email"
              required
              placeholder="Email супер-админа"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-[#5858E2]/25 bg-white px-3 py-2 text-sm font-medium text-[#5858E2] hover:bg-[#5858E2]/5"
            >
              Продолжить
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/admin/login" className="text-sm text-[#5858E2] hover:underline">
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}

async function requestResetAction(formData: FormData) {
  "use server";

  const email = (formData.get("email") as string)?.trim() ?? "";
  if (!email) {
    redirect("/admin/forgot-password?status=input");
  }

  let redirectTo = "/admin/forgot-password?step=code&status=sent";
  let pendingEmail = "";

  try {
    await requestSuperAdminPasswordResetByEmail(email);
    pendingEmail = email.trim().toLowerCase();
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_RESET_PENDING_EMAIL_COOKIE, pendingEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/admin/forgot-password",
    });
    cookieStore.set(ADMIN_RESET_TICKET_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
    redirectTo = "/admin/forgot-password?step=code&status=sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("профиле супер-админа") || message.includes("корректный email")) {
      redirectTo = "/admin/forgot-password?status=email";
    } else {
      console.error("admin.reset.request failed", error);
      redirectTo = `/admin/forgot-password?status=mail&reason=${encodeURIComponent(message || "unknown")}`;
    }
  }

  redirect(redirectTo);
}

async function verifyCodeAction(formData: FormData) {
  "use server";

  const code = (formData.get("code") as string)?.trim() ?? "";
  if (!code) {
    redirect("/admin/forgot-password?step=code&status=input");
  }

  const cookieStore = await cookies();
  const pendingEmail = (cookieStore.get(ADMIN_RESET_PENDING_EMAIL_COOKIE)?.value ?? "").trim().toLowerCase();
  if (!pendingEmail) {
    redirect("/admin/forgot-password?status=invalid");
  }

  let redirectTo = "/admin/forgot-password?step=reset&status=verified";
  try {
    const ticket = await verifySuperAdminPasswordResetCode({
      identifier: pendingEmail,
      code,
    });
    cookieStore.set(ADMIN_RESET_TICKET_COOKIE, ticket, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/admin/forgot-password",
    });
    cookieStore.set(ADMIN_RESET_PENDING_EMAIL_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
  } catch (error) {
    console.error("admin.reset.verify-code failed", error);
    redirectTo = "/admin/forgot-password?step=code&status=code";
  }

  redirect(redirectTo);
}

async function applyNewPasswordAction(formData: FormData) {
  "use server";

  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!newPassword || !confirmPassword) {
    redirect("/admin/forgot-password?step=reset&status=input");
  }
  if (newPassword !== confirmPassword) {
    redirect("/admin/forgot-password?step=reset&status=mismatch");
  }

  const cookieStore = await cookies();
  const ticket = cookieStore.get(ADMIN_RESET_TICKET_COOKIE)?.value ?? "";
  if (!ticket) {
    redirect("/admin/forgot-password?status=invalid");
  }

  let redirectTo = "/admin/forgot-password?status=done";

  try {
    await resetSuperAdminPasswordByTicket({
      ticket,
      newPassword,
    });
    cookieStore.set(ADMIN_RESET_TICKET_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
    cookieStore.set(ADMIN_RESET_PENDING_EMAIL_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
  } catch (error) {
    console.error("admin.reset.apply failed", error);
    cookieStore.set(ADMIN_RESET_TICKET_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
    cookieStore.set(ADMIN_RESET_PENDING_EMAIL_COOKIE, "", {
      path: "/admin/forgot-password",
      maxAge: 0,
    });
    redirectTo = "/admin/forgot-password?status=invalid";
  }

  redirect(redirectTo);
}
