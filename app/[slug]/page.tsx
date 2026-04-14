import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true }
  });

  if (!page) {
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

  // Получаем страницу из БД
  const page = await prisma.page.findUnique({
    where: {
      slug,
      isPublished: true
    }
  });

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}