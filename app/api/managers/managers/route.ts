import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

                                
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'База данных недоступна' }, { status: 500 });
    }

    const managers = await prisma.manager.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

                                 
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'База данных недоступна' }, { status: 500 });
    }

    const data = await request.json();
    
                                                          
    const existingManager = await prisma.manager.findUnique({
      where: { email: data.email },
    });

    if (existingManager) {
      return NextResponse.json({ error: 'Менеджер с таким email уже существует' }, { status: 400 });
    }

                      
    const hashedPassword = await bcrypt.hash(data.password, 10);

                        
    const manager = await prisma.manager.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'MANAGER',
        isActive: data.isActive !== undefined ? data.isActive : true,
        permissions: data.permissions || {
          psychologists: { view: true, edit: true },
          pages: { view: true, edit: true },
          listdate: { view: true, edit: true },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json(manager, { status: 201 });
  } catch (error) {
    console.error('Error creating manager:', error);
    return NextResponse.json({ error: 'Ошибка создания менеджера' }, { status: 500 });
  }
}