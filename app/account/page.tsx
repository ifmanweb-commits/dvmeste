import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AccountDashboard() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { email: session.user.email },
    select: {
      fullName: true,
      status: true,
      certificationLevel: true,
    },
  });

  if (!psychologist) {
    redirect("/login");
  }

  const statusMap = {
    PENDING: "Претендент",
    CANDIDATE: "Кандидат",
    ACTIVE: "В каталоге",
    SUSPENDED: "Заблокирован",
    REJECTED: "Отклонён",
  };

  const levelMap = {
    1: "Уровень 1",
    2: "Уровень 2",
    3: "Уровень 3",
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">
        Добро пожаловать, {psychologist.fullName}
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#5858E2]/5 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Ваш статус</p>
          <p className="text-xl font-semibold">
            {statusMap[psychologist.status] || "Неизвестно"}
          </p>
        </div>
        <div className="bg-[#5858E2]/5 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Уровень сертификации</p>
          <p className="text-xl font-semibold">
            {psychologist.certificationLevel 
              ? levelMap[psychologist.certificationLevel as keyof typeof levelMap] 
              : "Не сертифицирован"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🎯 Следующий шаг</h3>
          <p className="text-gray-600">
            {psychologist.status === "PENDING" && "Подтвердите email и заполните профиль, чтобы подать заявку в каталог"}
            {psychologist.status === "CANDIDATE" && "Заполните анкету для вступления в каталог"}
            {psychologist.status === "ACTIVE" && "Напишите статью"}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">📝 Статьи в этом месяце</h3>
          <p className="text-gray-600">Вы ещё не отправляли статей в этом месяце</p>
        </div>



        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">📢 Важно</h3>
          <p className="text-gray-600">Чтобы оставаться в каталоге, нужно сдавать по одной статье в месяц</p>
        </div>
      </div>
    </div>
  );
}