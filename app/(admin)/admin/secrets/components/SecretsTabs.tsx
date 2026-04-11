'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Доступы', href: '/admin/secrets' },
  { label: 'Ключи', href: '/admin/keys' },
  { label: 'Секретные страницы', href: '/admin/secret-pages' },
];

export default function SecretsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b border-gray-200 mt-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-[#5858E2] border-b-2 border-[#5858E2] hover:text-[#4a4ac7]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}