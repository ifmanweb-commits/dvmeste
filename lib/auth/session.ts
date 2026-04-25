import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { User } from '@prisma/client'
import { SUPERADMIN_EMAIL } from '@/lib/config'

const SESSION_NAME = 'session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 дней

// Определяем, работает ли приложение на localhost
const isLocalhost = process.env.IS_LOCALHOST === 'true'

// Тип пользователя со всеми нужными полями (берем напрямую из Prisma)
export type UserWithAllFields = User & { isSuperAdmin: boolean }

export async function createSession(userId: string) {
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_DURATION)
  
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires
    }
  })
  
  return session
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_NAME)?.value
  
  if (!sessionToken) return null
  
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { 
      user: true
    }
  })
  
  if (!session) return null
  
  // Проверяем, не истекла ли сессия
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    cookieStore.delete(SESSION_NAME)
    return null
  }
  
  return session
}

export async function setSessionCookie(sessionToken: string, expires: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_NAME, sessionToken, {
    httpOnly: true,
    secure: !isLocalhost,  // false для локалки, true для прода
    sameSite: 'lax',
    expires
  })
}

export async function removeSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_NAME)?.value
  
  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken }
    })
    cookieStore.delete(SESSION_NAME)
  }
}

export async function getCurrentUser(): Promise<UserWithAllFields | null> {
  const session = await getSession()
  const user = session?.user || null
  
  if (!user) return null
  
  // Добавляем флаг суперадмина на уровне кода
  const isSuperAdmin = user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
  
  return {
    ...user,
    isSuperAdmin
  }
}
