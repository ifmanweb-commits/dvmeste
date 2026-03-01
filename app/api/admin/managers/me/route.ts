import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const managerSession = cookieStore.get('manager_session');
    
    if (!managerSession) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }
    
    const managerData = cookieStore.get('manager_data');
    let managerInfo = null;
    
    if (managerData) {
      try {
        managerInfo = JSON.parse(managerData.value);
      } catch {
                                
      }
    }
    
    return NextResponse.json({
      success: true,
      isManager: true,
      data: managerInfo || { role: 'manager' }
    });
    
  } catch (error) {
    console.error('Ошибка проверки менеджера:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}