import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем инициализацию...');
  
  // Создаем админа, если его нет
  const adminEmail = 'admin@dvmeste.ru'; // Замени на свой email
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Администратор',
        role: 'ADMIN',
        emailVerified: new Date(), // Сразу подтвержден
      }
    });
    console.log('✅ Администратор создан');
  } else {
    console.log('⚠️ Администратор уже существует');
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
        role: 'MANAGER',
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