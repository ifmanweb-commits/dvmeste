'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require';
import { Certificate, User } from '@prisma/client';

export type CertificateWithUser = Certificate & {
  user: Pick<User, 'id' | 'fullName' | 'email' | 'firstName' | 'lastName' | 'middleName'> | null;
  template: { name: string; slug: string } | null;
};

export interface CertificatesListResult {
  items: CertificateWithUser[];
  total: number;
  pages: number;
  currentPage: number;
}

/**
 * Получить список всех выданных сертификатов с пагинацией
 */
export async function getCertificatesList(params?: {
  page?: number;
  limit?: number;
}): Promise<CertificatesListResult> {
  await requireAdmin();
  
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  
  if (!prisma) {
    return { items: [], total: 0, pages: 0, currentPage: page };
  }
  
  try {
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              firstName: true,
              lastName: true,
              middleName: true,
            }
          },
          template: {
            select: {
              name: true,
              slug: true,
            }
          }
        },
        orderBy: {
          issuedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count(),
    ]);
    
    const pages = Math.ceil(total / limit);
    
    return {
      items: certificates,
      total,
      pages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return { items: [], total: 0, pages: 0, currentPage: page };
  }
}

/**
 * Удалить сертификат
 */
export async function deleteCertificate(id: string) {
  await requireAdmin();
  
  if (!prisma) return { success: false, error: 'Нет подключения к БД' };
  
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id }
    });
    
    if (!certificate) {
      return { success: false, error: 'Сертификат не найден' };
    }
    
    // Удаляем файл сертификата
    const { unlink } = await import('fs/promises');
    const { join } = await import('path');
    
    const filePath = join(process.cwd(), 'public', certificate.imageUrl);
    try {
      await unlink(filePath);
    } catch (e) {
      console.error('Ошибка удаления файла сертификата:', e);
    }
    
    // Удаляем запись из БД
    await prisma.certificate.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return { success: false, error: 'Ошибка при удалении' };
  }
}

