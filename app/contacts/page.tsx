import Link from "next/link";
import { getPageBySlug } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { PageContent } from "@/components/PageContent";

export const metadata = buildMetadata({
  title: "Контакты — Давай вместе",
  description: "Связаться с командой «Давай вместе». Вопросы по реестру, сертификации и сотрудничеству.",
  path: "/contacts",
});

export default async function ContactsPage() {
  const page = await getPageBySlug("contacts");

  if (page) {
    return <PageContent title={page.title} template={page.template} content={page.content} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
        Контакты
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-neutral-dark">
        По вопросам реестра, сертификации и сотрудничества можно связаться с нами:
      </p>
      <div className="mt-8 rounded-2xl border border-neutral-light/80 bg-white/70 p-6">
        <p className="text-foreground">
          <strong>Телеграм:</strong>{" "}
          <a
            href="https://t.me/psy_smirnov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5858E2] underline hover:no-underline"
          >
            @psy_smirnov
          </a>
        </p>
        <p className="mt-2 text-neutral-dark">
          Домен сайта: dvmeste.ru · Проект «Давай вместе».
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-[#5858E2] underline hover:no-underline">
          ← На главную
        </Link>
      </p>
    </div>
  );
}
