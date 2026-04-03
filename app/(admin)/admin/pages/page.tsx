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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Управление страницами</h1>
        <p className="text-gray-500 mt-1">Настройка системных страниц</p>
      </div>

      <PagesTable pages={pages} />
    </div>
  );
}