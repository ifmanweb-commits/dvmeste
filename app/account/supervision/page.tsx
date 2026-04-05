import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SupervisionClient, { type Submission } from "@/components/account/SupervisionClient";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SupervisionPage({ searchParams }: PageProps) {
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

  // Загружаем данные для первых двух вкладок сразу на сервере
  const [availableSubmissions, reviewingSubmissions] = await Promise.all([
    // Доступные работы: status = SUBMITTED, reviewerId = null, нет review от текущего
    prisma.workSubmission.findMany({
      where: {
        status: 'SUBMITTED',
        reviewerId: null,
        NOT: {
          reviews: {
            some: {
              supervisorId: user.id,
            },
          },
        },
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            work: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    }),
    // На проверке: status = REVIEWING, reviewerId = текущий
    prisma.workSubmission.findMany({
      where: {
        status: 'REVIEWING',
        reviewerId: user.id,
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            work: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    }),
  ]);

  return (
    <SupervisionClient
      searchParams={searchParams}
      availableSubmissions={availableSubmissions}
      reviewingSubmissions={reviewingSubmissions}
    />
  );
}