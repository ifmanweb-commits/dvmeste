import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/awards/[id] - получить награду по ID
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
    const award = await prisma.award.findUnique({
      where: { id },
      include: {
        certifications: {
          include: {
            requirements: { include: { challenge: true } },
          },
        },
        certificationAwards: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            certification: { select: { title: true } },
          },
        },
      },
    });

    if (!award) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 });
    }

    return NextResponse.json(award);
  } catch (error) {
    console.error('Error fetching award:', error);
    return NextResponse.json(
      { error: 'Failed to fetch award' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/awards/[id] - обновить награду
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
    const contentType = request.headers.get('content-type') || '';
    
    let name: string | undefined;
    let type: 'CERTIFICATE' | 'BADGE' | undefined;
    let awardText: string | null | undefined;
    let explanationText: string | null | undefined;
    let isPublic: boolean | undefined;
    let certificateTemplateId: string | null | undefined;
    let badgeFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string | undefined;
      type = formData.get('type') as 'CERTIFICATE' | 'BADGE' | undefined;
      awardText = formData.get('awardText') as string | null | undefined;
      explanationText = formData.get('explanationText') as string | null | undefined;
      isPublic = formData.get('isPublic') === 'on';
      certificateTemplateId = formData.get('certificateTemplateId') as string | null | undefined;
      badgeFile = formData.get('badge') as File | null || null;
    } else {
      const body = await request.json();
      name = body.name;
      type = body.type;
      awardText = body.awardText;
      explanationText = body.explanationText;
      isPublic = body.isPublic;
      certificateTemplateId = body.certificateTemplateId;
    }

    const existing = await prisma.award.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 });
    }

    let badgeUrl: string | null | undefined;

    if (badgeFile && badgeFile.size > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'certification-badges');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileBuffer = await badgeFile.arrayBuffer();
      const ext = badgeFile.name.split('.').pop() || 'png';
      const filename = `award-${Date.now()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.writeFile(filepath, Buffer.from(fileBuffer));
      badgeUrl = `/images/certification-badges/${filename}`;
    }

    const award = await prisma.award.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(awardText !== undefined ? { awardText } : {}),
        ...(explanationText !== undefined ? { explanationText } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(certificateTemplateId !== undefined ? { certificateTemplateId } : {}),
        ...(badgeUrl !== undefined ? { badgeUrl } : {}),
      },
    });

    return NextResponse.json(award);
  } catch (error) {
    console.error('Error updating award:', error);
    return NextResponse.json(
      { error: 'Failed to update award' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/awards/[id] - удалить награду
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
    
    const existing = await prisma.award.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 });
    }

    await prisma.award.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting award:', error);
    return NextResponse.json(
      { error: 'Failed to delete award' },
      { status: 500 }
    );
  }
}