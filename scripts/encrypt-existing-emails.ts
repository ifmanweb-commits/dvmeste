// scripts/encrypt-existing-emails.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  })

  console.log(`Найдено пользователей: ${users.length}`)

  for (const user of users) {
    // Просто обновляем тем же email — плагин сам зашифрует
    await prisma.user.update({
      where: { id: user.id },
      data: { email: user.email }
    })
  }

  console.log('✅ Все email зашифрованы')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())