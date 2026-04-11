import { getBlocks } from '@/lib/actions/admin-blocks';
import BlocksForm from '@/components/admin/BlocksForm';
import { requireAdmin } from '@/lib/auth/require';
import HorNav from '../management/HorNav';

export default async function BlocksPage() {
  // Проверяем права администратора
  await requireAdmin();
  
  // Получаем все блоки
  const blocks = await getBlocks();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Управление блоками</h1>
        <p className="text-gray-500 mt-1">Редактирование контента сайта</p>

        {/* Вкладки */}
        <HorNav />
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-4">
          Здесь вы можете редактировать содержимое блоков, которые отображаются на сайте.
          Изменения применяются сразу после сохранения.
        </p>
        
        <BlocksForm blocks={blocks} />
      </div>
    </div>
  );
}