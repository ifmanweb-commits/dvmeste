import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/certifications - получить список всех сертификаций
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const certifications = await prisma.certification.findMany({
      include: {
        requirements: {
          include: {
            challenge: true,
          },
        },
        awards: {
          select: {
            id: true,
            userId: true,
            awardedAt: true,
          },
        },
        _count: {
          select: {
            requirements: true,
            awards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// POST /api/admin/certifications - создать сертификацию
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем тип контента для обработки FormData
    const contentType = request.headers.get('content-type') || '';
    
    let slug: string = '';
    let title: string = '';
    let description: string = '';
    let awardText: string | null = null;
    let isActive: boolean = true;
    let level: number | null = null;
    let order: number = 0;
    let rewardType: string = 'certificate';
    let certificateTemplateId: string | null = null;
    let badgeFile: File | null = null;
    let requirements: Array<{ challengeId: string; order: number }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      slug = formData.get('slug') as string;
      title = formData.get('title') as string;
      description = formData.get('description') as string || '';
      awardText = formData.get('awardText') as string || null;
      isActive = formData.get('isActive') === 'on';
      level = formData.get('level') === '' ? null : parseInt(formData.get('level') as string);
      order = parseInt(formData.get('order') as string) || 0;
      rewardType = (formData.get('rewardType') as string) || 'certificate';
      certificateTemplateId = formData.get('certificateTemplateId') as string || null;
      badgeFile = formData.get('badge') as File | null || null;

      // Парсим требования из FormData
      const reqKeys = Array.from(formData.keys()).filter(k => k.startsWith('requirements['));
      const reqIndices = new Set(reqKeys.map(k => k.match(/requirements\[(\d+)\]/)?.[1]).filter(Boolean));
      
      for (const index of reqIndices) {
        const challengeId = formData.get(`requirements[${index}][challengeId]`) as string;
        const orderVal = parseInt(formData.get(`requirements[${index}][order]`) as string) || 0;
        if (challengeId) {
          requirements.push({ challengeId, order: orderVal });
        }
      }
    } else {
      const body = await request.json();
      slug = body.slug;
      title = body.title;
      description = body.description || '';
      awardText = body.awardText || null;
      isActive = body.isActive ?? true;
      level = body.level ?? null;
      order = body.order ?? 0;
      rewardType = body.rewardType || 'certificate';
      certificateTemplateId = body.certificateTemplateId || null;
      requirements = body.requirements || [];
    }

    // Валидация
    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title' },
        { status: 400 }
      );
    }

    // Проверка уникальности slug
    const existing = await prisma.certification.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Certification with this slug already exists' },
        { status: 400 }
      );
    }

    let badgeUrl: string | null = null;

    // Если есть файл ачивки, сохраняем его
    if (badgeFile && badgeFile.size > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'certification-badges');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileBuffer = await badgeFile.arrayBuffer();
      const ext = badgeFile.name.split('.').pop() || 'png';
      const filename = `${slug}-${Date.now()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.writeFile(filepath, Buffer.from(fileBuffer));
      badgeUrl = `/images/certification-badges/${filename}`;
    }

    // Создаём сертификацию
    const certification = await prisma.certification.create({
      data: {
        slug,
        title,
        description,
        awardText,
        isActive,
        level,
        order,
        rewardType,
        badgeUrl,
        certificateTemplateId: certificateTemplateId || undefined,
        requirements: {
          create: requirements.map((req: { challengeId: string; order: number }) => ({
            challengeId: req.challengeId,
            order: req.order || 0,
          })),
        },
      },
      include: {
        requirements: {
          include: {
            challenge: true,
          },
        },
      },
    });

    return NextResponse.json(certification);
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { error: 'Failed to create certification' },
      { status: 500 }
    );
  }
}
