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
            award: {
              select: {
                id: true,
                type: true,
                badgeUrl: true,
                isPublic: true,
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
        award: {
          select: {
            id: true,
            name: true,
            type: true,
            badgeUrl: true,
            isPublic: true,
          },
        },
      },
      orderBy: {
        awardedAt: 'desc',
      },
    });

    // Фильтруем награды и сортируем по порядку сертификации
    const result = awards
      .filter(award => {
        // Если есть certification - проверяем isActive и isPublic
        if (award.certification) {
          return award.certification.isActive && (award.certification.award?.isPublic !== false);
        }
        // Если нет certification - проверяем award.isPublic
        return award.award?.isPublic !== false;
      })
      .sort((a, b) => {
        // Сортировка по order сертификации (сначала с certification, потом без)
        if (a.certification && b.certification) {
          return (a.certification.order ?? 0) - (b.certification.order ?? 0);
        }
        if (a.certification && !b.certification) return -1;
        if (!a.certification && b.certification) return 1;
        return 0;
      })
      .map(award => {
        const certificate = award.certificate;
        
        // Если есть certification - используем её данные
        if (award.certification) {
          const cert = award.certification;
          const awardData = cert.award;
          
          const rewardType = awardData?.type ?? 'CERTIFICATE';
          const badgeUrl = awardData?.badgeUrl ?? null;
          
          return {
            id: cert.id,
            slug: cert.slug,
            title: cert.title,
            description: cert.description,
            awardText: cert.awardText,
            level: cert.level,
            rewardType: rewardType === 'CERTIFICATE' ? 'certificate' : 'badge',
            badgeUrl,
            awardedAt: award.awardedAt,
            certificateTemplate: cert.certificateTemplate,
            verificationCode: certificate?.verificationCode,
            certificateImageUrl: certificate?.imageUrl,
          };
        }
        
        // Если нет certification - это награда без привязки (выданная через ключ)
        const awardData = award.award;
        const rewardType = awardData?.type ?? 'CERTIFICATE';
        const badgeUrl = awardData?.badgeUrl ?? null;
        
        return {
          id: award.id,
          slug: null,
          title: awardData?.name || 'Награда',
          description: null,
          awardText: null,
          level: null,
          rewardType: rewardType === 'BADGE' ? 'badge' : 'certificate',
          badgeUrl,
          awardedAt: award.awardedAt,
          certificateTemplate: null,
          verificationCode: null,
          certificateImageUrl: null,
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
