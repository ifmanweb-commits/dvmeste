import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
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

    // 6. Получить действия из ключа и вернуть их для предпросмотра
    const actionsData = key.actionsJson as any;
    const actions: KeyAction[] = (actionsData as { actions: KeyAction[] })?.actions || [];

    const previewActions = await Promise.all(
      actions.map(async (action) => ({
        type: action.type,
        label: getActionLabel(action),
        description: await getActionDescription(action),
      }))
    );

    return NextResponse.json({
      success: true,
      keyId: key.id,
      code: key.code,
      actions: previewActions,
    });
  } catch (error) {
    console.error('Error previewing key:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

function getActionLabel(action: KeyAction): string {
  const labels: Record<KeyAction['type'], string> = {
    grant_page_access: 'Доступ к странице',
    revoke_page_access: 'Снят доступ к странице',
    enroll_course: 'Зачисление на курс',
    unenroll_course: 'Отчисление с курса',
    complete_challenge: 'Испытание зачтено',
    add_balance: 'Начисление средств',
    subtract_balance: 'Списание средств',
    add_attempts: 'Добавление попыток',
    give_award: 'Выдача награды',
    revoke_award: 'Отзыв награды',
  };
  return labels[action.type] || action.type;
}

async function getActionDescription(action: KeyAction): Promise<string> {
  switch (action.type) {
    case 'grant_page_access':
    case 'revoke_page_access': {
      if (!action.pageId) return '';
      try {
        const page = await prisma.secretPage.findUnique({
          where: { id: action.pageId },
          select: { title: true },
        });
        return page?.title || action.pageId;
      } catch {
        return action.pageId;
      }
    }
    case 'enroll_course':
    case 'unenroll_course': {
      if (!action.courseId) return '';
      try {
        const course = await prisma.course.findUnique({
          where: { id: action.courseId },
          select: { title: true },
        });
        return course?.title || action.courseId;
      } catch {
        return action.courseId;
      }
    }
    case 'complete_challenge': {
      if (!action.challengeId) return '';
      try {
        const challenge = await prisma.challenge.findUnique({
          where: { id: action.challengeId },
          select: { title: true },
        });
        return challenge?.title || action.challengeId;
      } catch {
        return action.challengeId;
      }
    }
    case 'add_balance':
      return `+${action.amount} ₽`;
    case 'subtract_balance':
      return `-${action.amount} ₽`;
    case 'add_attempts':
      return `+${action.quantity} попыток`;
    case 'give_award':
    case 'revoke_award': {
      if (!action.awardId) return '';
      try {
        const award = await prisma.award.findUnique({
          where: { id: action.awardId },
          select: { name: true },
        });
        return award?.name || action.awardId;
      } catch {
        return action.awardId;
      }
    }
    default:
      return '';
  }
}
