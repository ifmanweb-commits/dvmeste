import { getBlocks } from '@/lib/actions/admin-blocks';
import BlocksForm from '@/components/admin/BlocksForm';
import { requireAdmin } from '@/lib/auth/require';

export default async function BlocksPage() {
  // Проверяем права администратора
  await requireAdmin();
  
  // Получаем все блоки
  const blocks = await getBlocks();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Управление блоками</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-4">
          Здесь вы можете редактировать содержимое блоков, которые отображаются на сайте.
          Изменения применяются сразу после сохранения.
        </p>
        
        <BlocksForm blocks={blocks} />
      </div>
    </div>
  );
}