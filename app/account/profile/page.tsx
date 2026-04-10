// app/account/profile/page.tsx
import { notFound, redirect } from "next/navigation";
import { ProfileFormContainer } from "@/components/account/ProfileFormContainer";
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import ProfileNav from '@/components/account/ProfileNav';

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const VALID_TABS = ['basic', 'detailed', 'photos', 'docs'] as const;
type ValidTab = typeof VALID_TABS[number];

function validateTab(tab?: string): ValidTab {
  if (!tab || !VALID_TABS.includes(tab as ValidTab)) {
    return 'basic';
  }
  return tab as ValidTab;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const sessionUser = await getCurrentUser();
  
  if (!sessionUser) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const activeTab = validateTab(params.tab);

  // Получаем свежие данные из БД со всеми новыми полями
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      documents: true
    }
  });
  if (!user) {
    notFound();
  }

  // Список парадигм консультирования
  const paradigmsData = await prisma.dataList.findUnique({
    where: { slug: 'paradigms' }
  });
  const availableParadigms = (paradigmsData?.items as string[]) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Профиль
          </h1>
        </div>

        {/* Навигационная панель */}
        <ProfileNav activeTab={activeTab} />

        {/* Контент формы */}
        <ProfileFormContainer user={user} availableParadigms={availableParadigms} activeTab={activeTab} />
      </div>
    </div>
  );
}
