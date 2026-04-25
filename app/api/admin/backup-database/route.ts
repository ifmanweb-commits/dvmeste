import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { backupDatabase, getLastBackupInfo } from "@/lib/cron/backup-database";

/**
 * GET - Получить информацию о последнем бекапе
 */
export async function GET() {
  const user = await getCurrentUser();
  
  if (!user || !user.isAdmin) {
    return NextResponse.json(
      { error: "Требуется авторизация администратора" },
      { status: 403 }
    );
  }
  
  try {
    const lastBackup = await getLastBackupInfo();
    
    if (!lastBackup) {
      return NextResponse.json({ 
        lastBackup: null,
        message: "Бекапы ещё не создавались"
      });
    }
    
    return NextResponse.json({
      lastBackup: {
        filename: lastBackup.filename,
        timestamp: lastBackup.timestamp,
        date: lastBackup.date.toISOString()
      }
    });
  } catch (error) {
    console.error("[backup-database-api] Ошибка получения информации:", error);
    return NextResponse.json(
      { error: "Ошибка при получении информации о бекапе" },
      { status: 500 }
    );
  }
}

/**
 * POST - Создать бекап базы данных вручную
 */
export async function POST() {
  const user = await getCurrentUser();
  
  if (!user || !user.isAdmin) {
    return NextResponse.json(
      { error: "Требуется авторизация администратора" },
      { status: 403 }
    );
  }
  
  try {
    const result = await backupDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        filename: result.filename,
        size: result.size
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Неизвестная ошибка" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[backup-database-api] Ошибка создания бекапа:", error);
    return NextResponse.json(
      { error: "Ошибка при создании бекапа" },
      { status: 500 }
    );
  }
}