'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteMenuItem } from '@/lib/site-menu';

interface AdminSiteMenuProps {
  menuItems: SiteMenuItem[];
}

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

export function AdminSiteMenu({ menuItems }: AdminSiteMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-[#5858E2]/10 transition-colors cursor-pointer"
        aria-label="Меню сайта"
        aria-expanded={isOpen}
      >
        <Image
          src="/logo.png"
          alt="Меню сайта"
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-transparent"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 top-12 z-[101] w-56 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="py-1">
                {menuItems.map((item) =>
                  isExternalHref(item.href) ? (
                    <a
                      key={item.id}
                      href={item.href || '/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#5858E2]"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.id}
                      href={item.href || '/'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#5858E2]"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
