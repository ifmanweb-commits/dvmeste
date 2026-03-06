import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Получаем страницу из БД
  const page = await prisma.page.findUnique({
    where: { 
      slug,
      isPublished: true 
    }
  });

  // Если страница не найдена или не опубликована - 404
  if (!page) {
    notFound();
  }

  // Рендерим страницу в зависимости от шаблона
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{page.adminTitle}</h1>
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content || '' }} 
      />
    </div>
  );
}

// Генерируем статические параметры (опционально)
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { slug: true }
  });

  return pages.map((page) => ({
    slug: page.slug,
  }));
}