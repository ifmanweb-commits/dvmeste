import { verifyEmail } from "@/lib/actions/verify-email";
import { redirect } from "next/navigation";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Ошибка подтверждения</h1>
        <p className="text-gray-600">Отсутствует токен подтверждения</p>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Ошибка подтверждения</h1>
        <p className="text-gray-600">{result.error}</p>
      </div>
    );
  }

  // Успешное подтверждение - перенаправляем в личный кабинет
  redirect("/account");
}