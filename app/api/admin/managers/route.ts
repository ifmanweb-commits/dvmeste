import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

                                       
export async function GET() {
  try {
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка менеджеров' },
      { status: 500 }
    );
  }
}

                                 
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
                                                          
    const existingManager = await prisma.manager.findUnique({
      where: { email: data.email },
    });

    if (existingManager) {
      return NextResponse.json(
        { error: 'Менеджер с таким email уже существует' },
        { status: 400 }
      );
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
          articles: {view: true, edit: true}
        },
      },
    });

                                    
    const { password, ...managerWithoutPassword } = manager;
    
    return NextResponse.json(managerWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating manager:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании менеджера' },
      { status: 500 }
    );
  }
}