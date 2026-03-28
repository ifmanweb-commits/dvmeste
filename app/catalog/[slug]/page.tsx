import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileGallery } from "@/components/catalog/ProfileGallery";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { buildMetadata, canonicalUrl, personJsonLd } from "@/lib/seo";
import { ComplaintModalTrigger } from "@/components/complaint/ComplaintModalTrigger";
import LeadFormModal from "@/components/lead/LeadFormModal";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";
import { EducationBlock } from "./components/EducationBlock";

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
      if (monthsDiff === 0) return "менее месяца";
      return `${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else if (yearsDiff === 1) {
      if (monthsDiff === 0) return "1 год";
      return `1 год ${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else if (yearsDiff < 5) {
      if (monthsDiff === 0) return `${yearsDiff} года`;
      return `${yearsDiff} года ${monthsDiff} ${getMonthWord(monthsDiff)}`;
    } else {
      if (monthsDiff === 0) return `${yearsDiff} лет`;
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

function formatWorkFormat(workFormat: string): string {
  switch (workFormat) {
    case "ONLINE":
      return "Онлайн";
    case "OFFLINE":
      return "Оффлайн";
    case "BOTH":
      return "Онлайн и оффлайн";
    default:
      return workFormat;
  }
}

function looksLikeHtml(value: string): boolean {
  return /<\s*[a-z][^>]*>/i.test(value);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!prisma) return buildMetadata({ title: "Психолог", path: `/catalog/${slug}` });
  
  try {
    const user = await prisma.user.findUnique({
      where: { slug },
      select: { fullName: true, shortBio: true },
    });
    if (!user) return buildMetadata({ title: "Психолог", path: `/catalog/${slug}` });
    return buildMetadata({
      title: user.fullName || 'Психолог',
      description: user.shortBio?.slice(0, 160) || "",
      path: `/catalog/${slug}`,
    });
  } catch (err) {
    if (isDbError(err)) return buildMetadata({ title: "Психолог", path: `/catalog/${slug}` });
    throw err;
  }
}

export default async function PsychologistProfilePage({ params }: PageProps) {
  const { slug } = await params;
  if (!prisma) notFound();

  // 1. Получаем пользователя
  const user = await prisma.user.findUnique({
    where: { slug },
  });

  if (!user || !user.isPublished || user.status !== "ACTIVE") notFound();

  // 2. Получаем проверенные фото из документов
  const photos = await prisma.document.findMany({
    where: {
      userId: user.id,
      type: "PHOTO",
      verifiedAt: { not: null }, // Только проверенные фото
    },
    select: { url: true },
    orderBy: { uploadedAt: "asc" },
  });

  // 3. Проверяем, есть ли avatarUrl среди проверенных фото
  const photoUrls = photos.map(p => p.url);
  const hasVerifiedAvatar = user.avatarUrl && photoUrls.includes(user.avatarUrl);
  
  // Формируем массив фото: сначала аватар (если прошёл модерацию), потом остальные проверенные
  const allPhotos: string[] = hasVerifiedAvatar
    ? [user.avatarUrl!, ...photoUrls.filter(url => url !== user.avatarUrl)]
    : photoUrls;

  // 4. Получаем проверенные документы об образовании
  const education = await prisma.document.findMany({
    where: {
      userId: user.id,
      type: { in: ['ACADEMIC_EDUCATION', 'PROFESSIONAL_TRAINING', 'COURSE', 'SUPPORTING_DOC', 'OTHER'] },
      verifiedAt: { not: null }, // Только проверенные документы
    },
    select: {
      type: true,
      organization: true,
      programName: true,
      year: true,
    },
    orderBy: {
      uploadedAt: 'asc',
    },
  });

  // 5. Получаем опубликованные статьи психолога
  const articles = await prisma.article.findMany({
    where: {
      userId: user.id,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  const pageUrl = canonicalUrl(`/catalog/${slug}`);
  const firstImage = allPhotos[0];
  const imageUrl = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${canonicalUrl("").replace(/\/$/, "")}${firstImage.startsWith("/") ? "" : "/"}${firstImage}`
    : undefined;

  const personSchema = personJsonLd({
    name: user.fullName || 'Психолог',
    description: user.shortBio || 'Профессионжальный психолог',
    url: pageUrl,
    image: imageUrl,
  });

  const mainParadigm = user.mainParadigm ?? [];
  const contactInfoRaw = user.contactInfo ?? "";
  const hasContactInfo = contactInfoRaw.trim().length > 0;
  const contactInfoIsHtml = looksLikeHtml(contactInfoRaw);
  const normalizedLongBio = normalizeEmbeddedLocalAssetUrls(user.longBio || "");
  const normalizedContactInfoHtml = normalizeEmbeddedLocalAssetUrls(contactInfoRaw);

  const experience = calculateExperience(user.firstDiplomaDate);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personSchema }}
      />
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link
            href="/catalog"
            className="mb-3 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#5858E2]"
          >
            <span>←</span>
            <span>Назад в каталог</span>
          </Link>

          {!user.isPublished && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              <p className="text-sm font-medium">Анкета не опубликована</p>
              <p className="text-xs text-amber-700">
                Включите «Отображать на сайте» в админке
              </p>
            </div>
          )}

          <article className="overflow-hidden rounded-lg border-2 border-lime-500 bg-white">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                <div className="sm:w-2/5">
                  <ProfileGallery
                    images={allPhotos}
                    fullName={user.fullName || 'Без имени'}
                  />
                </div>

                <div className="sm:w-3/5">
                  <div className="mb-2 pb-2 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {user.fullName}
                    </h1>
                    <p className="mt-2 inline-flex w-fit items-center rounded-full bg-[#A7FF5A] px-3 py-1 text-xs font-bold text-[#111a33] sm:text-sm">
                      Уровень квалификации: {user.certificationLevel}
                    </p>
                  </div>

                  <div className="space-y-1 mb-3">
                    {user.city && (
                      <p className="text-sm text-gray-700">{user.city}</p>
                    )}
                    {user.workFormat && (
                      <p className="text-sm text-gray-600">{formatWorkFormat(user.workFormat)}</p>
                    )}
                  </div>

                  <div className="mb-3 space-y-2">
                    <div className="flex flex-wrap gap-1">
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
                        {user.firstDiplomaDate && (
                          <span className="text-xs text-gray-500">
                            (с {new Date(user.firstDiplomaDate).toLocaleDateString("ru-RU", {
                              year: "numeric",
                              month: "long"
                            })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg font-bold text-[#5858E2]">
                      {user.price} ₽
                      <span className="ml-1 text-sm font-normal text-gray-500">/ сессия</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      На сайте с {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <LeadFormModal
                        psychologistId={user.id}
                        psychologistName={user.fullName || undefined}
                        triggerLabel="Связаться"
                      />
                      <ComplaintModalTrigger
                        psychologistName={user.fullName || 'Без имени'}
                        psychologistSlug={user.slug || ''}
                        triggerLabel="Пожаловаться"
                        triggerClassName="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="space-y-2 whitespace-pre-wrap">
                  <p className="text-sm text-gray-700">{user.shortBio}</p>
                  {user.longBio && (
                    <div
                      className="text-sm text-gray-700 [&_a]:text-[#5858E2] [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: normalizedLongBio }}
                    />
                  )}
                </div>
              </div>

              {/* Кнопка записи на консультацию - большая зеленая, по центру */}
              <div className="mt-6 flex justify-center">
                <LeadFormModal
                  psychologistId={user.id}
                  psychologistName={user.fullName || undefined}
                  triggerLabel="Записаться на консультацию"
                  triggerClassName="inline-flex items-center justify-center rounded-lg bg-[#4CAF50] px-6 py-3 text-base font-semibold text-white hover:bg-[#45a049] shadow-md"
                  large
                />
              </div>

              {/* Статьи психолога */}
              {articles.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2 text-base font-semibold text-gray-900">Автор статей:</h2>
                  <ul className="space-y-1">
                    {articles.map((article) => (
                      <li key={article.id}>
                        <Link
                          href={`/articles/${article.slug}`}
                          className="text-sm text-[#5858E2] hover:text-[#4d4dd0] hover:underline"
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <EducationBlock education={education} />

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div />
                  <div className="flex gap-3">
                    <Link href="/s/certification-levels">
                      <span className="text-xs text-gray-600 hover:text-[#5858E2] sm:text-sm">
                        Уровни сертификации
                      </span>
                    </Link>
                    <ComplaintModalTrigger
                      psychologistName={user.fullName || 'Без имени'}
                      psychologistSlug={user.slug || ''}
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