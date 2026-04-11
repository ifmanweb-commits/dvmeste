/**
 * Скрипт устанавливает wantPublished = true для всех пользователей со статусом ACTIVE
 * 
 * Запуск: npx tsx scripts/set-want-published-for-active-users.ts
 */

import { prisma } from '../lib/prisma';

async function main() {
  console.log('🚀 Обновление поля wantPublished для активных пользователей...');

  // Получаем всех пользователей со статусом ACTIVE
  const activeUsers = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      fullName: true,
      wantPublished: true,
    },
  });

  console.log(`📊 Найдено активных пользователей: ${activeUsers.length}`);

  // Обновляем всех пользователей
  const result = await prisma.user.updateMany({
    where: {
      status: 'ACTIVE',
    },
    data: {
      wantPublished: true,
    },
  });

  console.log(`✅ Обновлено пользователей: ${result.count}`);
  console.log('🎉 Готово! Все активные пользователи теперь отображаются в каталоге по умолчанию.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});