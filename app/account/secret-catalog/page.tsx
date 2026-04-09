import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { SecretCatalogForm } from './SecretCatalogForm';
import { getSecretCatalogSettings } from '@/lib/actions/secret-catalog';

export default async function SecretCatalogPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Проверяем доступ к секретному каталогу
  const catalogAccess = await prisma.userAccess.findFirst({
    where: {
      userId: user.id,
      resourceType: 'catalog',
      resourceId: 'secret-catalog'
    }
  });

  if (!catalogAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Секретный каталог
            </h1>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <h3 className="text-lg font-medium text-red-900">
              Доступ запрещён
            </h3>
            <p className="mt-2 text-red-700">
              У вас нет доступа к этой странице
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Доступ есть (любой - read или included) - показываем каталог

  // Получаем permission пользователя
  const accessAny = catalogAccess as any;
  const userPermission = accessAny?.metaData?.permission;

  // Получаем текущие настройки пользователя (если permission === 'included')
  let userSettings = null;
  if (userPermission === 'included') {
    userSettings = await getSecretCatalogSettings();
  }

  // Получаем психологов, у которых permission: 'included' к секретному каталогу
  // Используем $queryRaw для получения пользователей с проверкой metaData
  const psychologists = await prisma.$queryRaw`
    SELECT u.id, u."fullName", u."shortBio", u."contactInfo", u."avatarUrl", u."metaData"
    FROM "User" u
    INNER JOIN "UserAccess" ua ON u.id = ua."userId"
    WHERE ua."resourceType" = 'catalog'
      AND ua."resourceId" = 'secret-catalog'
      AND (ua."metaData"->>'permission') = 'included'
      AND (u."metaData"->'secretCatalog'->>'optIn') = 'true'
  ` as Array<{
    id: string;
    fullName: string;
    shortBio: string;
    contactInfo: string;
    avatarUrl: string;
    metaData: any;
  }>;

  // Преобразуем результат
  const filteredPsychologists: Array<{
    id: string;
    fullName: string;
    shortBio: string;
    contactInfo: string;
    avatarUrl: string | null;
    freeSessions: number;
    price: number;
    education?: Array<{ institution: string; specialty: string; year: string }>;
  }> = psychologists.map(p => {
    const meta = p.metaData;
    return {
      id: p.id,
      fullName: p.fullName || 'Без имени',
      shortBio: p.shortBio || '',
      contactInfo: p.contactInfo || '',
      avatarUrl: p.avatarUrl,
      freeSessions: meta?.secretCatalog?.freeSessions || 1,
      price: meta?.secretCatalog?.price || 0,
      education: meta?.education || []
    };
  });

  // Перемешиваем в случайном порядке
  const shuffledPsychologists = filteredPsychologists
    .sort(() => Math.random() - 0.5);

  // Получаем максимальное количество бесплатных сессий
  const maxFreeSessions = Math.max(
    ...shuffledPsychologists.map(p => p.freeSessions),
    1
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Психологи школы Сергея Смирнова
          </h1>
        </div>

        {/* Два информационных блока */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Для учащихся */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#5858E2] to-[#7a7af0]" />
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#5858E2]">
              <span>🎓</span> Для учащихся
            </h2>
            <p className="mb-3 text-gray-700">
              На этой странице — психологи, прошедшие обучение на курсе{' '}
              <span className="rounded bg-[#f0f3fe] px-1.5 py-0.5 font-medium text-[#5858E2]">
                «Психолог-практик»
              </span>{' '}
              и других курсах школы. Они дали согласие на размещение контактов для участников курса.
            </p>
            <p className="mb-3 text-gray-700">
              <span className="font-semibold text-[#5858E2]">Вы можете выбрать любого</span>{' '}
              специалиста, связаться по указанным контактам и получить консультации. Количество{' '}
              <span className="rounded bg-[#f0f3fe] px-1.5 py-0.5 font-medium text-[#5858E2]">
                бесплатных консультаций
              </span>{' '}
              указано в карточке.
            </p>
            <p className="text-gray-700">
              После завершения бесплатных сессий психолог может предложить продолжить работу на новых условиях, в том числе платно. Решение всегда за вами.
            </p>
            <div className="mt-4 rounded-lg bg-[#f8f9fc] p-4 text-sm text-gray-600">
              ✦ Таким образом, вы можете получить первичную личную терапию бесплатно в практически неограниченных количествах — обращаться к разным психологам никто не запрещает. Однако помните, что каждый новый психолог будет вынужден узнавать ваши особенности заново.
            </div>
            <div className="mt-4 inline-flex items-center rounded-full border border-[#5858E2]/20 bg-[#f0f3fe] px-4 py-2 text-sm font-medium text-[#5858E2]">
              Каждый психолог в каталоге предоставляет от 1 до {maxFreeSessions} бесплатных сессий
            </div>
            <p className="mt-3 text-sm text-gray-500">
              * Психологи на странице выводятся в случайном порядке.
            </p>
          </div>

          {/* Для выпускников */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#A7FF5A] to-[#7acc3c]" />
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#3d8b1c]">
              <span>⭐</span> Для выпускников
            </h2>
            <p className="mb-3 text-gray-700">
              <span className="font-semibold text-[#3d8b1c]">Сдавшие экзамен</span> могут разместить свои данные в этом каталоге. Это отличная возможность:
            </p>
            <ul className="mb-4 ml-4 space-y-1 text-gray-700">
              <li>• получать первых клиентов для тренировки навыков;</li>
              <li>• повышать профессионализм в реальной практике;</li>
              <li>• набирать материал для супервизий;</li>
              <li>• находить клиентов для платной работы, если ваша помощь понравится обратившимся.</li>
            </ul>
            <div className="my-3 border-t border-dashed border-gray-200" />
            <p className="mb-3 text-gray-700">
              <span className="font-semibold text-[#3d8b1c]">Условия размещения:</span> успешная сдача экзаменов и обязательство предоставить минимум{' '}
              <span className="rounded bg-[#e5f9d4] px-1.5 py-0.5 font-medium text-[#2d6e1a]">
                1 бесплатную сессию
              </span>{' '}
              для каждого из обратившихся учеников школы.
            </p>
            <p className="text-gray-700">
              Если ваша работа понравится клиенту, вы сможете продолжить на платной основе. Каталог может стать одним из источников платных клиентов.
            </p>
            <div className="mt-4 inline-flex items-center rounded-full border border-[#A7FF5A]/30 bg-[#e5f9d4] px-4 py-2 text-sm font-medium text-[#2d6e1a]">
              Получайте клиентов для старта практики бесплатно. Набирайтесь опыта, переходите к платным консультациям.
            </div>

            {/* Форма для пользователей с permission: 'included' */}
            {userPermission === 'included' && userSettings && (
              <SecretCatalogForm
                initialOptIn={userSettings.optIn}
                initialFreeSessions={userSettings.freeSessions}
                initialPrice={userSettings.price}
              />
            )}
          </div>
        </div>

        {/* Сетка психологов */}
        {shuffledPsychologists.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {shuffledPsychologists.map((psychologist) => (
              <PsychologistCard key={psychologist.id} psychologist={psychologist} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-500">Психологи пока не добавлены в каталог</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PsychologistCard({ psychologist }: { psychologist: {
  id: string;
  fullName: string;
  shortBio: string;
  contactInfo: string;
  avatarUrl: string | null;
  freeSessions: number;
  price: number;
  education?: Array<{ institution: string; specialty: string; year: string }>;
} }) {
  // Получаем инициалы для заглушки
  const nameParts = psychologist.fullName.split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[1][0]}`
    : nameParts[0]?.slice(0, 2).toUpperCase() || '?';

  return (
    <div className="group relative flex gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-[#5858E2]/40">
      {/* Фото или заглушка */}
      <div className="flex-shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#A7FF5A] bg-gray-100 shadow-md transition-colors group-hover:border-[#5858E2]">
          {psychologist.avatarUrl ? (
            <Image
              src={psychologist.avatarUrl}
              alt={psychologist.fullName}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5858E2]/20 to-[#A7FF5A]/20">
              <span className="text-2xl font-semibold text-[#5858E2]">{initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Информация */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-lg font-semibold text-gray-900">{psychologist.fullName}</h3>
        
        {psychologist.shortBio && (
          <p className="mt-2 text-sm text-gray-600">{psychologist.shortBio}</p>
        )}

        {/* Образование */}
        {psychologist.education && psychologist.education.length > 0 && (
          <div className="mt-2">
            <ul className="space-y-0.5">
              {psychologist.education.map((edu, idx) => (
                <li key={idx} className="text-xs text-gray-500">
                  {edu.institution} — {edu.specialty} ({edu.year})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#f0f3fe] px-3 py-1 text-sm font-medium text-[#5858E2]">
            Бесплатных сессий: {psychologist.freeSessions}
          </span>
          {psychologist.price > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#e5f9d4] px-3 py-1 text-sm font-medium text-[#2d6e1a]">
              Последующие: {psychologist.price} ₽
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <ContactButton contactInfo={psychologist.contactInfo} />
        </div>
      </div>
    </div>
  );
}

function ContactButton({ contactInfo }: { contactInfo: string }) {
  if (!contactInfo) {
    return null;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        <span className="inline-flex items-center rounded-full bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]">
          Показать контакт
        </span>
      </summary>
      <div className="mt-2 rounded-lg bg-[#f0f3fe] p-3 text-sm text-gray-700">
        {contactInfo.split('\n').map((line, i) => (
          <div key={i} className="break-words">
            {line}
          </div>
        ))}
      </div>
    </details>
  );
}