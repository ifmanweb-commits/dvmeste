import { redirect } from "next/navigation";
import {
  getSuperAdminPublicProfile,
  updateSuperAdminSettings,
} from "@/lib/super-admin";

type SearchParams = {
  saved?: string;
  error?: string;
};

function resolveMessage(params: SearchParams) {
  if (params.saved === "1") {
    return { type: "success" as const, text: "Профиль супер-админа обновлен." };
  }
  if (params.error === "input") {
    return { type: "error" as const, text: "Проверьте заполнение полей." };
  }
  if (params.error) {
    return { type: "error" as const, text: decodeURIComponent(params.error) };
  }
  return null;
}

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const admin = await getSuperAdminPublicProfile();
  const message = resolveMessage(params);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">Профиль супер-админа</h1>
        <p className="mt-2 text-sm text-neutral-dark">
          Управление доступом в раздел <code>/admin</code>.
        </p>
        <p className="mt-2 text-xs text-[#8b5e00]">
          Email в профиле должен быть подтвержден в UniSender, иначе отправка кода восстановления не сработает.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form action={saveSettingsAction} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Настройки доступа</h2>
        <p className="mt-1 text-sm text-neutral-dark">
          Одна форма: логин, почта и пароль супер-админа.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Логин</label>
            <input
              type="text"
              name="login"
              required
              defaultValue={admin.login}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={admin.email}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Текущий пароль</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-[#5858E2] py-2.5 font-medium text-white hover:bg-[#4848d0]"
        >
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}

async function saveSettingsAction(formData: FormData) {
  "use server";

  const login = (formData.get("login") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!login || !email || !password) {
    redirect("/admin/profile?error=input");
  }

  try {
    await updateSuperAdminSettings({
      login,
      email,
      password,
    });
    redirect("/admin/profile?saved=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить изменения.";
    redirect(`/admin/profile?error=${encodeURIComponent(message)}`);
  }
}
