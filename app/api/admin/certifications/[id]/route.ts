import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/certifications/[id] - получить сертификацию по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const certification = await prisma.certification.findUnique({
      where: { id },
      include: {
        requirements: {
          include: {
            challenge: true,
          },
          orderBy: { order: 'asc' },
        },
        awards: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(certification);
  } catch (error) {
    console.error('Error fetching certification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certification' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/certifications/[id] - обновить сертификацию
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      slug,
      title,
      description,
      isActive,
      level,
      order,
      requirements = [], // массив { challengeId, order }
    } = body;

    // Проверка существования
    const existing = await prisma.certification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Проверка уникальности slug если он изменён
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.certification.findUnique({
        where: { slug },
      });
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json(
          { error: 'Certification with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Обновляем сертификацию
    const certification = await prisma.certification.update({
      where: { id },
      data: {
        slug: slug || existing.slug,
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        level: level !== undefined ? (level === null ? null : parseInt(level)) : existing.level,
        order: order !== undefined ? parseInt(order) : existing.order,
        requirements: {
          deleteMany: {},
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
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/certifications/[id] - удалить сертификацию
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверка существования
    const existing = await prisma.certification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    await prisma.certification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { error: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}