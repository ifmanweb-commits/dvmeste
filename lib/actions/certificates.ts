'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require';
import { Certificate, User } from '@prisma/client';

export type CertificateWithUser = Certificate & {
  user: Pick<User, 'id' | 'fullName' | 'email' | 'firstName' | 'lastName' | 'middleName'> | null;
  template: { name: string; slug: string } | null;
};

/**
 * Получить список всех выданных сертификатов
 */
export async function getCertificatesList(): Promise<CertificateWithUser[]> {
  await requireAdmin();
  
  if (!prisma) return [];
  
  try {
    const certificates = await prisma.certificate.findMany({
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
      }
    });
    
    return certificates;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
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

