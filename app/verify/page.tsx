import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "next-auth/react"; // Импортируем signIn

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ошибка</h1>
          <p className="text-gray-600">Неверная ссылка подтверждения</p>
        </div>
      </div>
    );
  }

  // 1. Ищем психолога по токену
  const psychologist = await prisma.psychologist.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!psychologist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ошибка</h1>
          <p className="text-gray-600">Ссылка устарела или недействительна</p>
        </div>
      </div>
    );
  }

  // 2. Активируем пользователя в БД (как и раньше)
  await prisma.psychologist.update({
    where: { id: psychologist.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      status: "CANDIDATE",
    },
  });

  // 3. *** ВАЖНО: Создаём сессию для пользователя ***
  //    Используем email для входа через Email-провайдер.
  //    Перенаправляем на страницу аккаунта.
  try {
    // Используем метод signIn для автоматического входа по email
    await signIn("email", {
      email: psychologist.email,
      redirect: false, // Не редиректим сразу, чтобы обработать ошибки
    });
  } catch (error) {
    console.error("Auto sign-in after verification failed:", error);
    // Если автовход не удался, всё равно редиректим на логин
    redirect("/login?verified=1");
  }

  // Успех! Редиректим прямо в кабинет
  redirect("/account?welcome=1");
}