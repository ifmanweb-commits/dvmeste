import { getPages } from '@/lib/actions/admin-pages';
import { PagesTable } from '@/components/admin/pages/PagesTable';
import { requireAdmin } from '@/lib/auth/require';

export default async function AdminPagesPage() {
  // Проверяем права
  await requireAdmin();
  
  // Получаем все страницы
  const pagesData = await getPages();

  // Преобразуем Date в строку
  const pages = pagesData.map(page => ({
    ...page,
    createdAt: page.createdAt.toISOString(), // Date -> string
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Управление страницами</h1>
      </div>

      <PagesTable pages={pages} />
    </div>
  );
}