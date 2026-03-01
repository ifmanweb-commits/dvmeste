import type { Metadata } from "next";
import { SITE } from "@/config/site";

export interface PageMeta {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string;
  robots?: string;
}

   
                                       
   
export function canonicalUrl(path: string): string {
  const base = SITE.baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

   
                                                                                     
   
export function buildMetadata(meta: PageMeta): Metadata {
  const title = meta.title.includes(SITE.name)
    ? meta.title
    : `${meta.title} — ${SITE.name}`;
  const description = meta.description ?? SITE.description;
  const url = meta.path ? canonicalUrl(meta.path) : SITE.baseUrl;
  const image = meta.image ?? `${SITE.baseUrl}/og-default.png`;
  const keywords = meta.keywords ?? '';

  return {
    title,
    description,
    keywords,
    robots: meta.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: SITE.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(SITE.twitterHandle && { creator: SITE.twitterHandle }),
    },
  };
}

   
                                                                
   
export function webSiteJsonLd(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: SITE.baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.baseUrl}/psy-list?city={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return JSON.stringify(schema);
}

   
                                                 
   
export function organizationJsonLd(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.baseUrl,
    description: SITE.description,
  };
  return JSON.stringify(schema);
}

   
                                                                  
   
export function personJsonLd(data: {
  name: string;
  description: string;
  url: string;
  image?: string;
}): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.image && { image: data.image }),
  };
  return JSON.stringify(schema);
}
