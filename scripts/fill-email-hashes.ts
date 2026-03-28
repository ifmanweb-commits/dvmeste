import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  })

  console.log(`Найдено пользователей: ${users.length}`)

  for (const user of users) {
    const emailHash = createHash('sha256').update(user.email).digest('hex')
    
    await prisma.user.update({
      where: { id: user.id },
      data: { emailHash }
    })
  }

  console.log('✅ Хеши заполнены')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())