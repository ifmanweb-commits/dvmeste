import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { manualAdjustment } from '@/lib/billing';
import { KeyAction } from '@/app/(admin)/admin/keys/actions';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Необходимо указать код ключа' },
        { status: 400 }
      );
    }

    // 1. Получить текущего пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // 2. Найти ключ в БД
    const key = await prisma.key.findFirst({
      where: {
        code,
        isActive: true,
      },
    });

    if (!key) {
      return NextResponse.json(
        { error: 'Ключ не найден или неактивен' },
        { status: 404 }
      );
    }

    // 3. Проверить срок действия
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия ключа истёк' },
        { status: 400 }
      );
    }

    // 4. Проверить лимит использований
    if (key.maxUses > 0 && key.usedCount >= key.maxUses) {
      return NextResponse.json(
        { error: 'Лимит использований ключа исчерпан' },
        { status: 400 }
      );
    }

    // 5. Проверить, не использовал ли уже этот пользователь данный ключ
    const existingUse = await prisma.keyUse.findFirst({
      where: {
        keyId: key.id,
        userId: user.id,
      },
    });

    if (existingUse) {
      return NextResponse.json(
        { error: 'Вы уже использовали этот ключ' },
        { status: 400 }
      );
    }

    // 6. Получить действия из ключа
    const actionsData = key.actionsJson as any;
    const actions: KeyAction[] = (actionsData as { actions: KeyAction[] })?.actions || [];

    // 7. Выполнить каждое действие
    const executedActions: string[] = [];

    for (const action of actions) {
      try {
        await executeAction(action, user.id);
        executedActions.push(getActionLabel(action));
      } catch (error) {
        console.error(`Ошибка выполнения действия ${action.type}:`, error);
        // Продолжаем выполнение остальных действий
      }
    }

    // 8. Создать запись в KeyUse
    await prisma.keyUse.create({
      data: {
        keyId: key.id,
        userId: user.id,
      },
    });

    // 9. Увеличить usedCount у Key
    await prisma.key.update({
      where: { id: key.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ключ успешно активирован',
      executedActions,
    });
  } catch (error) {
    console.error('Error activating key:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function executeAction(action: KeyAction, userId: string) {
  switch (action.type) {
    case 'grant_page_access': {
      if (!action.pageId) throw new Error('Не указан pageId');
      await prisma.userAccess.create({
        data: {
          userId,
          resourceType: 'page',
          resourceId: action.pageId,
          grantedBy: `key_${action.type}`,
        },
      });
      break;
    }

    case 'revoke_page_access': {
      if (!action.pageId) throw new Error('Не указан pageId');
      await prisma.userAccess.deleteMany({
        where: {
          userId,
          resourceType: 'page',
          resourceId: action.pageId,
        },
      });
      break;
    }

    case 'enroll_course': {
      if (!action.courseId) throw new Error('Не указан courseId');
      const status = action.status || 'enrolled';
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: action.courseId,
          },
        },
        update: { status },
        create: {
          userId,
          courseId: action.courseId,
          status,
        },
      });
      break;
    }

    case 'unenroll_course': {
      if (!action.courseId) throw new Error('Не указан courseId');
      await prisma.userCourse.deleteMany({
        where: {
          userId,
          courseId: action.courseId,
        },
      });
      break;
    }

    case 'complete_challenge': {
      if (!action.challengeId) throw new Error('Не указан challengeId');
      // Создаём запись об успешной попытке
      await prisma.challengeAttempt.create({
        data: {
          userId,
          challengeId: action.challengeId,
          status: 'COMPLETED',
          passed: true,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
      break;
    }

    case 'add_balance': {
      if (!action.amount || action.amount <= 0) throw new Error('Не указана сумма');
      // Сумма в рублях, переводим в копейки
      const amountInKopecks = action.amount * 100;
      await manualAdjustment(userId, amountInKopecks, `Начисление по ключу`);
      break;
    }

    case 'subtract_balance': {
      if (!action.amount || action.amount <= 0) throw new Error('Не указана сумма');
      // Сумма в рублях, переводим в копейки
      const amountInKopecks = action.amount * 100;
      await manualAdjustment(userId, -amountInKopecks, `Списание по ключу`);
      break;
    }

    case 'add_attempts': {
      if (!action.challengeId) throw new Error('Не указан challengeId');
      if (!action.quantity || action.quantity <= 0) throw new Error('Не указано количество');
      
      // Получаем или создаём состояние пользователя для испытания
      const state = await prisma.challengeUserState.upsert({
        where: {
          challengeId_userId: {
            challengeId: action.challengeId,
            userId,
          },
        },
        update: {
          attemptsLeft: { increment: action.quantity },
        },
        create: {
          challengeId: action.challengeId,
          userId,
          attemptsLeft: action.quantity,
        },
      });
      break;
    }

    default:
      console.warn(`Неизвестный тип действия: ${action.type}`);
  }
}

function getActionLabel(action: KeyAction): string {
  const labels: Record<KeyAction['type'], string> = {
    grant_page_access: 'Доступ к странице',
    revoke_page_access: 'Снят доступ к странице',
    enroll_course: 'Зачислен на курс',
    unenroll_course: 'Отчислен с курса',
    complete_challenge: 'Испытание зачтено',
    add_balance: 'Начислены средства',
    subtract_balance: 'Списаны средства',
    add_attempts: 'Добавлены попытки',
  };
  return labels[action.type] || action.type;
}