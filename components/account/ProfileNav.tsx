import Link from 'next/link';
import { User, FileText, Camera, ClipboardList } from 'lucide-react';

type ActiveTab = 'basic' | 'detailed' | 'photos' | 'docs';

interface ProfileNavProps {
  activeTab: ActiveTab;
}

const navItems: { id: ActiveTab; label: string; href: string; icon: React.ElementType }[] = [
  { id: 'basic', label: 'Личные данные', href: '/account/profile?tab=basic', icon: User },
  { id: 'detailed', label: 'Подробная информация', href: '/account/profile?tab=detailed', icon: FileText },
  { id: 'photos', label: 'Фотографии', href: '/account/profile?tab=photos', icon: Camera },
  { id: 'docs', label: 'Документы', href: '/account/profile?tab=docs', icon: ClipboardList },
];

export default function ProfileNav({ activeTab }: ProfileNavProps) {
  return (
    <nav className="mb-8 border-b border-gray-200">
      <ul className="flex gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#5858E2] text-[#5858E2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}