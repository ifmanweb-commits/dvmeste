import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      fullName: true,
      email: true,
      price: true,
      contactInfo: true,
      status: true,
    },
  });

  if (!psychologist) {
    redirect("/login");
  }

  const isActive = psychologist.status === "ACTIVE";

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Профиль</h2>
      
      {/* Для CANDIDATE — полное редактирование */}
      {!isActive && (
        <ProfileForm 
          initialData={psychologist} 
          isCandidate={true} 
        />
      )}

      {/* Для ACTIVE — заготовка (пока без редактирования) */}
      {isActive && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <p className="text-gray-600 mb-2">Редактирование профиля для ACTIVE</p>
            <p className="text-sm text-gray-500">В разработке</p>
          </div>
          
          {/* Показываем текущие данные */}
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-gray-600">Имя</p>
              <p className="font-medium">{psychologist.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{psychologist.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Цена</p>
              <p className="font-medium">{psychologist.price} ₽</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Контакты</p>
              <p className="font-medium">{psychologist.contactInfo || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}