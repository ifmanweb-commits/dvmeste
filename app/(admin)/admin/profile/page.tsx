import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admin/ProfileForm";

type SearchParams = {
  saved?: string;
  error?: string;
};

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Получаем данные админа из базы
  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'MANAGER')) {
    redirect("/admin");
  }

  const message = params.saved === "1" 
    ? { type: "success" as const, text: "Профиль обновлен." }
    : params.error === "1"
    ? { type: "error" as const, text: "Ошибка при сохранении." }
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {admin.role === 'ADMIN' ? 'Профиль администратора' : 'Профиль менеджера'}
        </h1>
        <p className="mt-2 text-sm text-neutral-dark">
          Управление вашими данными для входа в систему.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <ProfileForm admin={admin} />
    </div>
  );
}