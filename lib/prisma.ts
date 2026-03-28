// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const encryptionKey = process.env.ENCRYPTION_KEY || process.env.PRISMA_FIELD_ENCRYPTION_KEY

if (!encryptionKey) {
  throw new Error('Encryption key is not set')
}

// Создаем клиент с расширением
const prismaClient = new PrismaClient()

export const prisma = prismaClient.$extends(
  fieldEncryptionExtension({
    encryptionKey
  })
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient as any