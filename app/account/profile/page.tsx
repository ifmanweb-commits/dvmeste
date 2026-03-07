// app/account/profile/page.tsx
import { notFound, redirect } from "next/navigation";
import { ProfileFormContainer } from "@/components/account/ProfileFormContainer";
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma'; // Убедись, что импорт верный

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  
  if (!sessionUser) {
    redirect('/auth/login');
  }

  // Получаем свежие данные из БД со всеми новыми полями
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      documents: true // Понадобится для вкладки документов
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
        <p className="text-gray-500 mt-2">Управление профилем и квалификацией</p>
      </div>

      <ProfileFormContainer user={user} />
    </div>
  );
}