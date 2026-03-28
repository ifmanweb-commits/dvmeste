import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Запуск seed: создание администратора...');

  const adminEmail = 'ifman@yandex.ru';
  const normalizedEmail = adminEmail.toLowerCase().trim();
  const emailHash = createHash('sha256').update(normalizedEmail).digest('hex');

  // Проверяем, существует ли уже пользователь с таким emailHash
  const existingUser = await prisma.user.findUnique({
    where: { emailHash }
  });

  if (existingUser) {
    console.log('⚠️ Пользователь уже существует. Обновляем флаги...');
    
    // Обновляем существующего пользователя
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isAdmin: true,
        isManager: false,
        fullName: existingUser.fullName || 'Администратор',
        emailVerified: existingUser.emailVerified || new Date(),
        status: 'ACTIVE' as any
      }
    });

    console.log('✅ Пользователь обновлён');
  } else {
    console.log('🆕 Создаём нового пользователя...');

    // Создаём нового пользователя
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        emailHash,
        fullName: 'Администратор',
        isAdmin: true,
        isManager: false,
        emailVerified: new Date(),
        status: 'ACTIVE' as any
      }
    });

    console.log('✅ Новый пользователь создан');
  }

  console.log('🎉 Seed завершён!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });