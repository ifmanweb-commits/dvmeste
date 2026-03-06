import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function HomePage() {
  // Ищем страницу с нужным slug в БД
  const page = await prisma.page.findUnique({
    where: { 
      slug: 'home', // или любой другой slug, который вы используете для главной
      isPublished: true 
    }
  });

  if (!page) {
    // Если страница не найдена - можно показать дефолтную
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Добро пожаловать</h1>
        <p>Содержимое главной страницы не настроено</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{page.adminTitle}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
    </div>
  );
}