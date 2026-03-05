import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Запуск seed: создание администратора...');

  const adminEmail = 'ifman@yandex.ru';

  // Проверяем, существует ли уже пользователь с таким email
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { psychologist: true }
  });

  if (existingUser) {
    console.log('⚠️ Пользователь уже существует. Обновляем флаги...');
    
    // Обновляем существующего пользователя
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        isAdmin: true,
        isPsychologist: true,
        isManager: false,
        fullName: existingUser.fullName || 'Администратор',
        emailVerified: existingUser.emailVerified || new Date(),
      }
    });

    // Если у пользователя нет записи в Psychologist, создаём
    if (!existingUser.psychologist) {
      await prisma.psychologist.create({
        data: {
          email: adminEmail,
          fullName: existingUser.fullName || 'Администратор',
          slug: 'admin-psychologist',
          status: 'ACTIVE',
          isPublished: true,
          gender: 'Не указан',
          birthDate: new Date('1990-01-01'),
          city: 'Не указан',
          workFormat: 'Онлайн',
          shortBio: '',
          longBio: '',
          price: 0,
          contactInfo: '',
          userId: existingUser.id,
        }
      });
      console.log('✅ Запись в Psychologist создана');
    }

    console.log('✅ Пользователь обновлён');
  } else {
    console.log('🆕 Создаём нового пользователя...');

    // Создаём нового пользователя
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Администратор',
        isAdmin: true,
        isPsychologist: true,
        isManager: false,
        emailVerified: new Date(),
      }
    });

    // Создаём запись в Psychologist
    await prisma.psychologist.create({
      data: {
        email: adminEmail,
        fullName: 'Администратор',
        slug: 'admin-psychologist',
        status: 'ACTIVE',
        isPublished: true,
        gender: 'Не указан',
        birthDate: new Date('1990-01-01'),
        city: 'Не указан',
        workFormat: 'Онлайн',
        shortBio: '',
        longBio: '',
        price: 0,
        contactInfo: '',
        userId: user.id,
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