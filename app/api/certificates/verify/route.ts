import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/certificates/verify?code=А7Б9В2Г5 - проверить сертификат по коду
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Код не указан' },
        { status: 400 }
      );
    }

    // Ищем сертификат по коду
    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            isPublished: true,
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Сертификат не найден' },
        { status: 404 }
      );
    }

    // Возвращаем данные сертификата (публично)
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
        imageUrl: certificate.imageUrl,
        template: certificate.template,
        user: {
          fullName: certificate.user.fullName,
          isPublished: certificate.user.isPublished,
        }
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Ошибка при проверке сертификата' },
      { status: 500 }
    );
  }
}