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

    const body = await request.json();
    const {
      slug,
      title,
      description,
      isActive = true,
      level = null,
      order = 0,
      requirements = [], // массив { challengeId, order }
    } = body;

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

    // Создаём сертификацию
    const certification = await prisma.certification.create({
      data: {
        slug,
        title,
        description,
        isActive,
        level: level !== null ? parseInt(level) : null,
        order: parseInt(order) || 0,
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