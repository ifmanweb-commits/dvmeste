   
                                           
                                                  
   
export const SITE = {
  name: "Давай вместе",
  shortName: "Давай вместе",
  description:
    "Подберите психолога по парадигме, цене и городу. Каталог специалистов с фильтрами и уровнями сертификации. Сервис «Давай вместе».",
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://davay-vmeste.example.com",
  locale: "ru_RU",
  twitterHandle: undefined as string | undefined,
} as const;

export type SiteConfig = typeof SITE;
