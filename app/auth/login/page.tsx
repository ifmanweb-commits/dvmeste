import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import Link from "next/link";

type SearchParams = {
  registered?: string;
  email?: string;
  sent?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const isRegistered = params.registered === "1";
  const email = params.email;
  const isSent = params.sent === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Вход на сайт</h1>
          <p className="mt-2 text-sm text-neutral-dark">
            Введите email, мы пришлем ссылку для входа
          </p>
        </div>

        {isRegistered && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700">
              ✓ Регистрация успешна! Проверьте почту для входа.
            </p>
            {email && (
              <p className="text-sm text-gray-600 mt-1">
                Письмо отправлено на <strong>{email}</strong>
              </p>
            )}
          </div>
        )}

        {isSent && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700">
              ✓ Ссылка для входа отправлена!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Проверьте почту и перейдите по ссылке
            </p>
          </div>
        )}

        {!isSent && !isRegistered && (
          <div className="mt-6">
            <MagicLinkForm />
          </div>
        )}

        <div className="mt-6 border-t border-neutral-200 pt-6 text-center">
          <Link href="/register" className="text-sm text-[#5858E2] hover:underline">
            Нет аккаунта? Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}