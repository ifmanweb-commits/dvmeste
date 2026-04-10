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
    
    // Проверяем тип контента для обработки FormData
    const contentType = request.headers.get('content-type') || '';
    
    let slug: string | undefined;
    let title: string | undefined;
    let description: string | undefined;
    let isActive: boolean | undefined;
    let level: number | null | undefined;
    let order: number | undefined;
    let rewardType: string | undefined;
    let certificateTemplateId: string | null | undefined;
    let badgeFile: File | null = null;
    let requirements: Array<{ challengeId: string; order: number }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      slug = formData.get('slug') as string || undefined;
      title = formData.get('title') as string || undefined;
      description = formData.get('description') as string;
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
      description = body.description;
      isActive = body.isActive;
      level = body.level;
      order = body.order;
      rewardType = body.rewardType;
      certificateTemplateId = body.certificateTemplateId;
      requirements = body.requirements || [];
    }

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

    let badgeUrl: string | null | undefined = undefined;

    // Если есть новый файл ачивки, сохраняем его
    if (badgeFile && badgeFile.size > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'certification-badges');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileBuffer = await badgeFile.arrayBuffer();
      const ext = badgeFile.name.split('.').pop() || 'png';
      const filename = `${existing.slug}-${Date.now()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.writeFile(filepath, Buffer.from(fileBuffer));
      badgeUrl = `/images/certification-badges/${filename}`;
    }

    // Обновляем сертификацию
    const certification = await prisma.certification.update({
      where: { id },
      data: {
        slug: slug || existing.slug,
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        level: level !== undefined ? level : existing.level,
        order: order !== undefined ? order : existing.order,
        rewardType: rewardType !== undefined ? rewardType : existing.rewardType,
        badgeUrl: badgeUrl !== undefined ? badgeUrl : existing.badgeUrl,
        certificateTemplateId: certificateTemplateId !== undefined ? certificateTemplateId : existing.certificateTemplateId,
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