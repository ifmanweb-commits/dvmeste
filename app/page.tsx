import { prisma } from '@/lib/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';

// Генерация метаданных для главной страницы
export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({
    where: { slug: 'home', isPublished: true }
  });

  if (!page) {
    return {
      title: 'Давай вместе — Каталог психологов',
      description: 'Подберите психолога по парадигме, цене и городу. Фильтры, уровни сертификации, удобный каталог. Сервис «Давай вместе».',
    };
  }

  return {
    title: page.metaTitle || page.adminTitle || 'Давай вместе — Каталог психологов',
    description: page.metaDescription || 'Подберите психолога по парадигме, цене и городу. Фильтры, уровни сертификации, удобный каталог. Сервис «Давай вместе».',
    keywords: page.metaKeywords?.split(',').map(k => k.trim()) || [],
    robots: page.metaRobots || 'index, follow',
  };
}

export default async function HomePage() {
  // Ищем страницу с slug 'home' в БД
  const page = await prisma.page.findUnique({
    where: { 
      slug: 'home',
      isPublished: true 
    }
  });

  if (!page) {
    // Если страница не найдена - показываем дефолтную
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Добро пожаловать</h1>
        <p>Содержимое главной страницы не настроено</p>
      </div>
    );
  }

  return <PageRenderer page={page} />;
}