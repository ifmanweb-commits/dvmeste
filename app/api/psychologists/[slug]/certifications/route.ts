import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/psychologists/[slug]/certifications - получить публичные награды психолога
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

    // Получаем публичные сертификации, которые есть у этого психолога
    const certifications = await prisma.certification.findMany({
      where: {
        isPublic: true,
        isActive: true,
        awards: {
          some: {
            userId: psychologist.id,
          },
        },
      },
      include: {
        awards: {
          where: {
            userId: psychologist.id,
          },
          select: {
            awardedAt: true,
            certificate: {
              select: {
                id: true,
                verificationCode: true,
                imageUrl: true,
              }
            }
          },
        },
        certificateTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
            backgroundUrl: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Форматируем результат
    const result = certifications.map((cert) => {
      const award = cert.awards[0];
      const certificate = award?.certificate;
      return {
        id: cert.id,
        slug: cert.slug,
        title: cert.title,
        description: cert.description,
        awardText: cert.awardText,
        level: cert.level,
        rewardType: cert.rewardType,
        badgeUrl: cert.badgeUrl,
        awardedAt: award?.awardedAt,
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