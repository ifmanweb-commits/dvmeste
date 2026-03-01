import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Личный кабинет психолога</h1>
        <LogoutButton />
      </div>
      
      <div className="flex gap-8">
        {/* Боковое меню */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1">
            <a href="/account" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              📊 Кабинет
            </a>
            <a href="/account/profile" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              👤 Профиль
            </a>
            <a href="/account/articles" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              📝 Мои статьи
            </a>
            <a href="/account/exam" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              🎓 Экзамены и сертификация
            </a>
            <a href="/account/catalog" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              📋 Заявка в каталог
            </a>
            <a href="/account/settings" className="block px-4 py-2 rounded-lg hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
              ⚙️ Настройки
            </a>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 bg-white rounded-xl border border-neutral-200 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}