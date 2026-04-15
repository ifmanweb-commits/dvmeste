import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const user = await getCurrentUser();
  const isAdminOrManager = user?.isAdmin || user?.isManager;
  
  const page = await prisma.page.findUnique({
    where: { slug }
  });

  if (!page || (!page.isPublished && !isAdminOrManager)) {
    return {
      title: 'Страница не найдена',
    };
  }

  return {
    title: page.metaTitle || page.adminTitle || 'Давай вместе',
    description: page.metaDescription || undefined,
    keywords: page.metaKeywords?.split(',').map(k => k.trim()) || [],
    robots: page.metaRobots || 'index, follow',
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  
  const user = await getCurrentUser();
  const isAdminOrManager = user?.isAdmin || user?.isManager;

  // Получаем страницу из БД
  const page = await prisma.page.findUnique({
    where: { slug }
  });

  // Если страница не найдена или не опубликована и пользователь не админ/менеджер
  if (!page || (!page.isPublished && !isAdminOrManager)) {
    notFound();
  }

  return <PageRenderer page={page} />;
}
