import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/awards - получить список всех наград
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const awards = await prisma.award.findMany({
      include: {
        certifications: { select: { id: true, title: true } },
        certificationAwards: { select: { id: true, userId: true, awardedAt: true } },
        _count: { select: { certifications: true, certificationAwards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(awards);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch awards' },
      { status: 500 }
    );
  }
}

// POST /api/admin/awards - создать награду
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    let name: string = '';
    let type: 'CERTIFICATE' | 'BADGE' = 'CERTIFICATE';
    let awardText: string | null = null;
    let isPublic: boolean = false;
    let certificateTemplateId: string | null = null;
    let badgeFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      type = (formData.get('type') as 'CERTIFICATE' | 'BADGE') || 'CERTIFICATE';
      awardText = formData.get('awardText') as string || null;
      isPublic = formData.get('isPublic') === 'on';
      certificateTemplateId = formData.get('certificateTemplateId') as string || null;
      badgeFile = formData.get('badge') as File | null || null;
    } else {
      const body = await request.json();
      name = body.name;
      type = body.type || 'CERTIFICATE';
      awardText = body.awardText || null;
      isPublic = body.isPublic ?? false;
      certificateTemplateId = body.certificateTemplateId || null;
    }

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    let badgeUrl: string | null = null;

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

    const award = await prisma.award.create({
      data: {
        name,
        type,
        awardText,
        isPublic,
        certificateTemplateId: certificateTemplateId || undefined,
        badgeUrl,
      },
    });

    return NextResponse.json(award);
  } catch (error) {
    console.error('Error creating award:', error);
    return NextResponse.json(
      { error: 'Failed to create award' },
      { status: 500 }
    );
  }
}