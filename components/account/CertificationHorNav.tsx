import Link from 'next/link';
import { Award, BookOpen, FileBadge, FileText, ClipboardList } from 'lucide-react';

type ActiveTab = 'certifications' | 'tests' | 'works' | 'lessons' | 'questionnaires';

interface CertificationHorNavProps {
  activeTab: ActiveTab;
}

const navItems: { id: ActiveTab; label: string; href: string; icon: React.ElementType }[] = [
  { id: 'certifications', label: 'Сертификации', href: '/account/certification', icon: Award },
  { id: 'tests', label: 'Тесты', href: '/account/certification/tests', icon: BookOpen },
  { id: 'works', label: 'Работы', href: '/account/certification/works', icon: FileBadge },
  { id: 'lessons', label: 'Уроки', href: '/account/certification/lessons', icon: FileText },
  { id: 'questionnaires', label: 'Вопросники', href: '/account/certification/questionnaires', icon: ClipboardList },
];

export default function CertificationHorNav({ activeTab }: CertificationHorNavProps) {
  return (
    <nav className="mb-8 border-b border-gray-200">
      <ul className="flex flex-wrap gap-4 sm:gap-6">
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