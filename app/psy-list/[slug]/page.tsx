import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileGallery } from "@/components/catalog/ProfileGallery";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { buildMetadata, canonicalUrl, personJsonLd } from "@/lib/seo";
import { ComplaintModalTrigger } from "@/components/complaint/ComplaintModalTrigger";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

function isDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
      msg.includes("DATABASE_URL") ||
      msg.includes("PrismaClientInitializationError") ||
      msg.includes("does not exist") ||
      msg.includes("Unknown column")
  );
}

type EducationItem = {
  year?: string | number;
  type?: string;
  organization?: string;
  title?: string;
  isDiploma?: boolean;
};

                                   
function calculateExperience(firstDiplomaDate: Date | null): string | null {
  if (!firstDiplomaDate) return null;

  try {
    const diplomaDate = new Date(firstDiplomaDate);

                                  
    if (isNaN(diplomaDate.getTime())) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;                              

    const diplomaYear = diplomaDate.getFullYear();
    const diplomaMonth = diplomaDate.getMonth() + 1;

                                             
    let yearsDiff = currentYear - diplomaYear;
    let monthsDiff = currentMonth - diplomaMonth;

                                                             
    if (monthsDiff < 0) {
      yearsDiff--;
      monthsDiff += 12;
    }

                            
    if (yearsDiff === 0) {
      if (monthsDiff === 0) {
        return "менее месяца";
      }
      return `${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else if (yearsDiff === 1) {
      if (monthsDiff === 0) {
        return "1 год";
      }
      return `1 год ${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else if (yearsDiff < 5) {
      if (monthsDiff === 0) {
        return `${yearsDiff} года`;
      }
      return `${yearsDiff} года ${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else {
      if (monthsDiff === 0) {
        return `${yearsDiff} лет`;
      }
      return `${yearsDiff} лет ${monthsDiff} ${getMonthWord(monthsDiff)}`;
    }
  } catch (error) {
    console.error("Ошибка при расчете опыта работы:", error);
    return null;
  }
}

                                                                  
function getMonthWord(months: number): string {
  if (months === 1) return "месяц";
  if (months >= 2 && months <= 4) return "месяца";
  return "месяцев";
}

function looksLikeHtml(value: string): boolean {
  return /<\s*[a-z][^>]*>/i.test(value);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!prisma) return buildMetadata({ title: "Психолог", path: `/psy-list/${slug}` });
  try {
    const p = await prisma.psychologist.findUnique({
      where: { slug },
      select: { fullName: true, shortBio: true },
    });
    if (!p) return buildMetadata({ title: "Психолог", path: `/psy-list/${slug}` });
    return buildMetadata({
      title: p.fullName,
      description: p.shortBio.slice(0, 160),
      path: `/psy-list/${slug}`,
    });
  } catch (err) {
    if (isDbError(err)) return buildMetadata({ title: "Психолог", path: `/psy-list/${slug}` });
    throw err;
  }
}

export default async function PsychologistProfilePage({ params }: PageProps) {
  const { slug } = await params;
  if (!prisma) notFound();
  let psychologist: Awaited<ReturnType<typeof prisma.psychologist.findUnique>>;

  try {
    psychologist = await prisma.psychologist.findUnique({
      where: { slug },
    });
  } catch (err) {
    if (isDbError(err)) notFound();
    throw err;
  }
  if (!psychologist) notFound();

  const pageUrl = canonicalUrl(`/psy-list/${slug}`);
  const firstImage = psychologist.images[0];
  const imageUrl =
      firstImage && firstImage !== ""
          ? firstImage.startsWith("http")
              ? firstImage
              : `${canonicalUrl("").replace(/\/$/, "")}${firstImage.startsWith("/") ? "" : "/"}${firstImage}`
          : undefined;
  const personSchema = personJsonLd({
    name: psychologist.fullName,
    description: psychologist.shortBio,
    url: pageUrl,
    image: imageUrl,
  });

  const education = (psychologist.education as EducationItem[] | null) ?? [];
  const mainParadigm = (psychologist.mainParadigm ?? []) as string[];
  const contactInfoRaw = psychologist.contactInfo ?? "";
  const hasContactInfo = contactInfoRaw.trim().length > 0;
  const contactInfoIsHtml = looksLikeHtml(contactInfoRaw);
  const normalizedLongBio = normalizeEmbeddedLocalAssetUrls(psychologist.longBio || "");
  const normalizedContactInfoHtml = normalizeEmbeddedLocalAssetUrls(contactInfoRaw);

                             
  const experience = calculateExperience(psychologist.firstDiplomaDate);

  console.log("Парадигмы психолога:", mainParadigm);               

  return (
      <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: personSchema }}
        />
        <div className="min-h-screen bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            {                  }
            <Link
                href="/psy-list"
                className="mb-3 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#5858E2]"
            >
              <span>←</span>
              <span>Назад в каталог</span>
            </Link>

            {                         }
            {!psychologist.isPublished && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  <p className="text-sm font-medium">Анкета не опубликована</p>
                  <p className="text-xs text-amber-700">
                    Включите «Отображать на сайте» в админке
                  </p>
                </div>
            )}

            {                       }
            <article className="overflow-hidden rounded-lg border-2 border-lime-500 bg-white">
              <div className="p-4 sm:p-5 md:p-6">
                {                  }
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                  {             }
                  <div className="sm:w-2/5">
                    <ProfileGallery
                        images={psychologist.images ?? []}
                        fullName={psychologist.fullName}
                    />
                  </div>

                  {                }
                  <div className="sm:w-3/5">
                    <div className="mb-2 pb-2 border-b border-gray-100">
                      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        {psychologist.fullName}
                      </h1>
                      <p className="mt-2 inline-flex w-fit items-center rounded-full bg-[#A7FF5A] px-3 py-1 text-xs font-bold text-[#111a33] sm:text-sm">
                        Уровень квалификации: {psychologist.certificationLevel}
                      </p>
                    </div>

                    <div className="space-y-1 mb-3">
                      {psychologist.city && (
                          <p className="text-sm text-gray-700">
                            {psychologist.city}
                          </p>
                      )}
                      {psychologist.workFormat && (
                          <p className="text-sm text-gray-600">
                            {psychologist.workFormat}
                          </p>
                      )}
                    </div>

                    {                          }
                    <div className="mb-3 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {                              }
                        {mainParadigm.length > 0 ? (
                            mainParadigm.map((p, index) => (
                                <Badge key={`${p}-${index}`} variant="primary">
                                  {p}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="neutral">Нет парадигм</Badge>
                        )}
                      </div>

                      {                 }
                      {experience && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-blue-700">
                            Опыт работы: {experience}
                          </span>
                            </div>

                            {                                                      }
                            {psychologist.firstDiplomaDate && (
                                <span className="text-xs text-gray-500">
                            (с {new Date(psychologist.firstDiplomaDate).toLocaleDateString("ru-RU", {
                                  year: "numeric",
                                  month: "long"
                                })})
                          </span>
                            )}
                          </div>
                      )}
                    </div>

                    {                 }
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-[#5858E2]">
                        {psychologist.price} ₽
                        <span className="ml-1 text-sm font-normal text-gray-500">
                        / сессия
                      </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        На сайте с {new Date(psychologist.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                      })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href="#contact-booking"
                          className="inline-flex items-center scroll-auto justify-center rounded-lg bg-[#5858E2] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#4d4dd0]"
                        >
                          Записаться
                        </a>
                        <ComplaintModalTrigger
                          psychologistName={psychologist.fullName}
                          psychologistSlug={psychologist.slug}
                          triggerLabel="Пожаловаться"
                          triggerClassName="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {            }
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    О себе
                  </h2>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      {psychologist.shortBio}
                    </p>
                    {psychologist.longBio && (
                        <div
                            className="text-sm text-gray-700 [&_a]:text-[#5858E2] [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: normalizedLongBio }}
                        />
                    )}
                  </div>
                </div>

                {                            }
                {hasContactInfo && (
                    <div id="contact-booking" className="mt-4 pt-4 border-t border-gray-100">
                      <h2 className="mb-2 text-lg font-semibold text-gray-900">
                        Записаться на консультацию
                      </h2>
                      <div className="rounded-lg border border-[#4CAF50]/35 bg-[#EEF8F0] p-3 shadow-sm sm:p-4">
                        {contactInfoIsHtml ? (
                          <div
                              className="text-sm text-[#2f4d33] [&_a]:font-semibold [&_a]:text-[#2F8F46] [&_a]:underline"
                              dangerouslySetInnerHTML={{ __html: normalizedContactInfoHtml }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#2f4d33]">
                            {contactInfoRaw}
                          </div>
                        )}
                      </div>
                    </div>
                )}

                {                 }
                {education.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Образование
                        </h2>

                        {                                 }
                        {psychologist.firstDiplomaDate && (
                            <div className="text-xs text-gray-500">
                              Первый диплом: {new Date(psychologist.firstDiplomaDate).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                            </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {[...education]
                            .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
                            .map((item, i) => (
                                <div
                                    key={i}
                                    className={`rounded border p-2 ${item.isDiploma ? 'border bg-lime-50 border-lime-200' : 'border-gray-200 bg-gray-50'}`}
                                >
                                  <div className="flex gap-2">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${item.isDiploma ? 'bg-lime-100' : 'bg-[#5858E2]/10'}`}>
                                      {item.type === "диплом" ? "🎓" :
                                          item.type === "сертификат" ? "📜" :
                                              item.type === "удостоверение" ? "📄" : "📚"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                                        <div className="flex items-center gap-1">
                                          {item.year && (
                                              <span className="font-medium text-gray-900">
                                      {item.year}
                                    </span>
                                          )}
                                          {item.type && (
                                              <span className={`text-xs capitalize sm:text-sm ${item.isDiploma ? 'text-lime-700' : 'text-[#5858E2]'}`}>
                                      {item.type}
                                    </span>
                                          )}
                                        </div>
                                        {item.isDiploma && (
                                            <span className="text-xs font-medium text-lime-700">

                                  </span>
                                        )}
                                      </div>
                                      {item.organization && (
                                          <h4 className="mt-0.5 font-medium text-gray-900 text-sm">
                                            {item.organization}
                                          </h4>
                                      )}
                                      {item.title && (
                                          <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                                            {item.title}
                                          </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            ))}
                      </div>
                    </div>
                )}

                {                   }
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/psy-list">
                      <Button variant="outline" size="sm">
                        ← В каталог
                      </Button>
                    </Link>
                    <div className="flex gap-3">
                      <Link href="/certification-levels">
                      <span className="text-xs text-gray-600 hover:text-[#5858E2] sm:text-sm">
                        Уровни сертификации
                      </span>
                      </Link>
                      <ComplaintModalTrigger
                        psychologistName={psychologist.fullName}
                        psychologistSlug={psychologist.slug}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </>
  );
}
