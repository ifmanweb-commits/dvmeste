import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email.service'

const TOKEN_EXPIRY = 15 * 60 * 1000 // 15 минут

export async function createMagicLink(email: string) {
  // Нормализуем email
  email = email.toLowerCase().trim()
  
  // Генерируем токен
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TOKEN_EXPIRY)
  
  // Удаляем старые токены для этого email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  })
  
  // Создаём новый токен
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })
  
  // Формируем ссылку
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || process.env.NEXTAUTH_URL
    || 'http://localhost:3000'
  const link = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
  
  // Отправляем письмо используя твой emailService
  await emailService.sendEmail({
    to: email,
    subject: 'Вход в Давай вместе',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Вход на сайт</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5858E2; border-bottom: 2px solid #5858E2; padding-bottom: 10px;">Вход на сайт "Давай вместе"</h2>
          <p>Здравствуйте!</p>
          <p>Для входа на сайт нажмите на кнопку:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background-color: #5858E2; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Войти на сайт
            </a>
          </div>
          
          <p>Или скопируйте ссылку в браузер:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
            ${link}
          </p>
          
          <p style="color: #777; font-size: 14px;">Ссылка действительна 15 минут.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #777; font-size: 14px;">
            Если вы не запрашивали вход, просто проигнорируйте это письмо.
          </p>
        </body>
      </html>
    `
  })
  
  return { success: true }
}

export async function verifyMagicLink(token: string, email: string) {
  email = email.toLowerCase().trim()
  
  // Ищем токен
  const verification = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token,
      expires: { gt: new Date() }
    }
  })
  
  if (!verification) {
    return { error: 'invalid_or_expired' }
  }
  
  // Удаляем использованный токен - используем token вместо id
  await prisma.verificationToken.delete({
    where: { token: verification.token } // Изменено: token вместо id
  })
  
  return { success: true }
}