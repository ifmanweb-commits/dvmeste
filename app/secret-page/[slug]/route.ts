import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // 1. Найти страницу в БД по slug
  const page = await prisma.secretPage.findFirst({
    where: {
      slug,
      isActive: true
    }
  })

  if (!page) {
    return new NextResponse(
      buildErrorPage('Страница не найдена', 'Запрашиваемая страница не существует или не активна.', 404),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    )
  }

  // 2. Получить текущего пользователя
  const user = await getCurrentUser()

  if (!user) {
    return new NextResponse(
      buildErrorPage('Требуется авторизация', 'Для просмотра этой страницы необходимо войти в систему.', 401),
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    )
  }

  // 3. Проверить доступ
  const access = await prisma.userAccess.findFirst({
    where: {
      userId: user.id,
      resourceType: 'page',
      resourceId: page.id
    }
  })

  if (!access) {
    return new NextResponse(
      buildErrorPage('Доступ запрещён', 'У вас нет доступа к этой странице.', 403),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    )
  }

  // 4. Прочитать HTML файл из public/files/
  const filePath = join(process.cwd(), 'public', page.filePath)

  if (!existsSync(filePath)) {
    return new NextResponse(
      buildErrorPage('Файл не найден', 'HTML файл страницы не найден на сервере.', 404),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    )
  }

  try {
    const htmlContent = await readFile(filePath, 'utf-8')

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error reading secret page file:', error)
    return new NextResponse(
      buildErrorPage('Ошибка сервера', 'Не удалось прочитать файл страницы.', 500),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }
    )
  }
}

function buildErrorPage(title: string, message: string, statusCode: number): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .error-container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    .error-code {
      font-size: 72px;
      font-weight: 700;
      color: #667eea;
      line-height: 1;
      margin-bottom: 16px;
    }
    .error-title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 12px;
    }
    .error-message {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .back-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">${statusCode === 401 ? '🔒' : statusCode === 403 ? '🚫' : '📄'}</div>
    <div class="error-code">${statusCode}</div>
    <h1 class="error-title">${title}</h1>
    <p class="error-message">${message}</p>
    <a href="/" class="back-button">На главную</a>
  </div>
</body>
</html>
  `.trim()
}