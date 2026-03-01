import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { ComplaintModalTrigger } from "@/components/complaint/ComplaintModalTrigger";

export const metadata = buildMetadata({
  title: "Жалоба — Давай вместе",
  description: "Сообщить о нарушении или подать жалобу. Сервис «Давай вместе».",
  path: "/complaint",
});

export default function ComplaintPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground">
        Жалоба
      </h1>
      <p className="mt-4 leading-relaxed text-neutral-dark">
        Если вы столкнулись с некорректным поведением специалиста или нарушением правил сервиса, отправьте жалобу через форму ниже.
        После заполнения форма отправит жалобу напрямую через сайт.
      </p>
      <div className="mt-6">
        <ComplaintModalTrigger triggerLabel="Открыть форму жалобы" />
      </div>
      <p className="mt-8">
        <Link href="/contacts" className="text-[#5858E2] underline hover:no-underline">
          Все контакты
        </Link>
        {" · "}
        <Link href="/psy-list" className="text-[#5858E2] underline hover:no-underline">
          Каталог психологов
        </Link>
      </p>
    </div>
  );
}
