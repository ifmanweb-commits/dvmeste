import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import QuestionnaireReviewClient from "./ReviewClient";

export default async function QuestionnaireReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Проверка прав супервизора
  if (!user?.isSupervisor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Доступ закрыт
          </h1>
          <p className="text-gray-600 mb-6">
            У вас нет прав для просмотра этой страницы. Раздел доступен только супервизорам.
          </p>
          <a
            href="/account"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться в личный кабинет
          </a>
        </div>
      </div>
    );
  }

  // Получаем_submission вопросника
  const submission = await prisma.questionnaireSubmission.findUnique({
    where: { id },
    include: {
      challenge: {
        include: {
          questionnaire: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      reviews: {
        where: {
          supervisorId: user.id,
        },
      },
    },
  });

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Работа не найдена</h1>
          <a
            href="/account/supervision"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к супервизии
          </a>
        </div>
      </div>
    );
  }

  // Проверяем, что супервизор взял эту работу
  if (submission.reviews.length === 0 || submission.status !== "REVIEWING") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещён</h1>
          <p className="text-gray-600 mb-6">
            Вы не брали эту работу на проверку или она уже проверена.
          </p>
          <a
            href="/account/supervision"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к супервизии
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/account/supervision"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад
            </a>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Проверка вопросника</h1>
              <p className="text-sm text-gray-600">{submission.challenge.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <QuestionnaireReviewClient
          submission={{
            id: submission.id,
            // Формат answers в базе: [{index, text}] - это вопросы
            // Ответы могут храниться в том же массиве или отдельно
            // Преобразуем к формату {index, text, answer}
            answers: (submission.answers as any[])?.map((item: any) => ({
              index: item.index ?? 0,
              text: item.text || '',
              answer: item.answer || '',
            })) || [],
            startedAt: submission.startedAt.toISOString(),
            submittedAt: submission.submittedAt.toISOString(),
            challenge: {
              title: submission.challenge.title,
              questionnaire: submission.challenge.questionnaire ? {
                instructionsForSupervisor: submission.challenge.questionnaire.instructionsForSupervisor,
                requiredReviews: submission.challenge.questionnaire.requiredReviews,
                reviewsToPass: submission.challenge.questionnaire.reviewsToPass,
                questionsPool: submission.challenge.questionnaire.questionsPool as string[],
              } : null,
            },
            psychologist: {
              fullName: submission.user.fullName,
              email: submission.user.email,
            },
          }}
        />
      </div>
    </div>
  );
}