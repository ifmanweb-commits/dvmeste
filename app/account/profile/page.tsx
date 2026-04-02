// app/account/profile/page.tsx
import { notFound, redirect } from "next/navigation";
import { ProfileFormContainer } from "@/components/account/ProfileFormContainer";
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
        <p className="text-gray-500 mt-2">Управление профилем и квалификацией</p>
      </div>

      <ProfileFormContainer user={user} availableParadigms={availableParadigms} activeTab={activeTab} />
    </div>
  );
}
