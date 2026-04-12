import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/psychologists/[slug]/certifications - получить публичные награды психолога
// Оптимизированный запрос: начинаем от CertificationAward для использования составного индекса
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Находим психолога по slug
    const psychologist = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    // Получаем все награды психолога с данными сертификации и сертификата
    // Используем CertificationAward как основную таблицу для эффективного использования индекса
    const awards = await prisma.certificationAward.findMany({
      where: {
        userId: psychologist.id,
      },
      include: {
        certification: {
          where: {
            isPublic: true,
            isActive: true,
          },
          include: {
            certificateTemplate: {
              select: {
                id: true,
                name: true,
                slug: true,
                backgroundUrl: true,
              },
            },
          },
        },
        certificate: {
          select: {
            id: true,
            verificationCode: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        awardedAt: 'desc',
      },
    });

    // Фильтруем награды (оставляем только те, где сертификация публичная и активная)
    // и сортируем по порядку сертификации
    const result = awards
      .filter(award => award.certification)
      .sort((a, b) => {
        // Сортировка по order сертификации
        return (a.certification?.order ?? 0) - (b.certification?.order ?? 0);
      })
      .map(award => {
        const cert = award.certification!;
        const certificate = award.certificate;
        return {
          id: cert.id,
          slug: cert.slug,
          title: cert.title,
          description: cert.description,
          awardText: cert.awardText,
          level: cert.level,
          rewardType: cert.rewardType,
          badgeUrl: cert.badgeUrl,
          awardedAt: award.awardedAt,
          certificateTemplate: cert.certificateTemplate,
          // Для сертификата используем verificationCode из Certificate
          verificationCode: certificate?.verificationCode,
          // Если есть сгенерированный сертификат, используем его imageUrl
          certificateImageUrl: certificate?.imageUrl,
        };
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching psychologist certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}
