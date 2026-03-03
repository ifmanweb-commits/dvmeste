import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем инициализацию...');
  
  // Создаем админа, если его нет
  const adminEmail = 'admin@dvmeste.ru';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Администратор',
        isAdmin: true,        // новый флаг
        isManager: false,
        isPsychologist: false,
        emailVerified: new Date(),
      }
    });
    console.log('✅ Администратор создан');
  } else {
    // Обновляем существующего админа, если нужно
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        isAdmin: true,
        isManager: false,
      }
    });
    console.log('✅ Администратор обновлён');
  }

  // Создаем тестового менеджера (опционально)
  const managerEmail = 'manager@dvmeste.ru';
  
  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail }
  });

  if (!existingManager) {
    await prisma.user.create({
      data: {
        email: managerEmail,
        fullName: 'Менеджер',
        isAdmin: false,
        isManager: true,
        isPsychologist: false,
        emailVerified: new Date(),
      }
    });
    console.log('✅ Менеджер создан');
  }

  console.log('✅ Готово!');
}

main()
  .catch(e => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });