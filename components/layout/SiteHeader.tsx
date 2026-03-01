import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getSiteMenuItems } from "@/lib/site-menu";

function isExternalHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

function getMenuEmoji(href: string) {
  if (isExternalHref(href)) return "🔗";
  if (href === "/psy-list") return "👤";
  if (href === "/courses") return "📚";
  if (href === "/connect") return "💼";
  if (href === "/contacts") return "📞";
  if (href.startsWith("/lib")) return "📖";
  if (href === "/complaint") return "⚠️";
  return "🔍";
}

export async function SiteHeader() {
  noStore();
  const menu = await getSiteMenuItems();

  return (
      <header id="site-header" className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between">
            {             }
            <Link
                href="/"
                className="-ml-1 inline-flex items-center gap-3 text-lg font-bold text-gray-900 transition-colors hover:text-[#5858E2] sm:-ml-2 sm:text-xl"
            >
              {                                      }
              <Image
                src="/logo.png"
                alt="Логотип Давай вместе"
                width={56}                         
                height={56}                        
                className="h-14 w-14 rounded-md object-cover -ml-0.5"                                       
                priority
              />
              {                          }
              <span className="ml-1.5 sm:ml-2.5">Давай вместе</span>
            </Link>

            {                     }
            <nav className="hidden md:flex items-center gap-1" aria-label="Главное меню">
              {menu.map((item) =>
                isExternalHref(item.href) ? (
                  <a
                    key={item.id}
                    href={item.href || "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#5858E2]/10 hover:text-[#5858E2] transition-all duration-200"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href || "/"}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#5858E2]/10 hover:text-[#5858E2] transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {                    }
            <details className="group md:hidden">
              <summary className="flex cursor-pointer items-center gap-1 rounded-lg p-2 text-gray-700 hover:bg-[#5858E2]/10 hover:text-[#5858E2] transition-all duration-200 list-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="sr-only">Меню</span>
              </summary>

              {             }
              <div className="fixed inset-0 z-40 mt-14 bg-black/20 backdrop-blur-sm" aria-hidden="true"></div>

              {                                        }
              <div className="fixed left-1/2 top-14 z-50 w-[90vw] max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  {                              }
                  <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/10 ring-1 ring-white/50">

                    {                                   }
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#5858E2] to-lime-400"></div>

                    {                  }
                    <div className="p-4">
                      <div className="space-y-1">
                        {menu.map((item) =>
                          isExternalHref(item.href) ? (
                            <a
                              key={item.id}
                              href={item.href || "/"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 hover:bg-[#5858E2]/10 hover:text-[#5858E2] transition-all duration-200"
                            >
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5858E2]/10 transition-transform group-hover:scale-110">
                                <span className="text-xs text-[#5858E2]">{getMenuEmoji(item.href)}</span>
                              </div>
                              <span>{item.label}</span>
                              <span className="ml-auto opacity-40 text-xs">→</span>
                            </a>
                          ) : (
                            <Link
                              key={item.id}
                              href={item.href || "/"}
                              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 hover:bg-[#5858E2]/10 hover:text-[#5858E2] transition-all duration-200"
                            >
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5858E2]/10 transition-transform group-hover:scale-110">
                                <span className="text-xs text-[#5858E2]">{getMenuEmoji(item.href)}</span>
                              </div>
                              <span>{item.label}</span>
                              <span className="ml-auto opacity-40 text-xs">→</span>
                            </Link>
                          )
                        )}
                      </div>

                      {                          }
                      <div className="mt-4 pt-4 border-t border-gray-200/30">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
                          <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#5858E2] to-lime-400"></div>
                          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-xs text-gray-500">Давай вместе • Психологи</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {                     }
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <div className="h-4 w-4 rotate-45 border-t border-l border-white/20 bg-white/95 backdrop-blur-xl"></div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
  );
}
