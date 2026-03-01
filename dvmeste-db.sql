--
-- PostgreSQL database dump
--

\restrict LgDwb4q87vk2x933jkdwdAIaqGnGDpIqyAjYxTRG8yz0ZbDeRhUDj8bXSDI7B1T

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MANAGER'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Manager; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Manager" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'MANAGER'::text NOT NULL,
    permissions jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Manager" OWNER TO postgres;

--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_accounts (
    id text NOT NULL,
    login text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admin_accounts OWNER TO postgres;

--
-- Name: admin_password_reset_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_password_reset_codes (
    id text NOT NULL,
    "adminId" text NOT NULL,
    "codeHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_password_reset_codes OWNER TO postgres;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articles (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    tags text[],
    "authorId" text,
    "shortText" text,
    "catalogSlug" text,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- Name: data_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_lists (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    items jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_lists OWNER TO postgres;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id text NOT NULL,
    label text NOT NULL,
    href text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "parentId" text
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    template text NOT NULL,
    content text NOT NULL,
    images text[],
    "showHeader" boolean DEFAULT false NOT NULL,
    "showFooter" boolean DEFAULT false NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: psychologists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.psychologists (
    id text NOT NULL,
    slug text NOT NULL,
    "fullName" text NOT NULL,
    gender text NOT NULL,
    "birthDate" date NOT NULL,
    city text NOT NULL,
    "workFormat" text NOT NULL,
    "firstDiplomaDate" date,
    "lastCertificationDate" date,
    "mainParadigm" text[],
    "certificationLevel" integer NOT NULL,
    "shortBio" character varying(400) NOT NULL,
    "longBio" text NOT NULL,
    price integer NOT NULL,
    "contactInfo" text NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    education json,
    images text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.psychologists OWNER TO postgres;

--
-- Data for Name: Manager; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Manager" (id, email, password, name, role, permissions, "isActive", "createdAt", "updatedAt") FROM stdin;
cmm24g8xo0006my0kev9qbcqp	jakalunkachev@gmail.com	$2b$10$pYvXnSdmPqCaVuruRhluJu/dRk3DRa.K9XrZM8h.3vlLurF1omr/O	Gasan Alievich Gasanov	MANAGER	{"pages": {"edit": true, "view": true}, "articles": {"edit": false, "view": false}, "listdate": {"edit": true, "view": true}, "managers": {"edit": false, "view": false}, "psychologists": {"edit": true, "view": true}}	t	2026-02-25 14:20:30.396	2026-02-25 18:19:58.677
\.


--
-- Data for Name: admin_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_accounts (id, login, email, "passwordHash", "createdAt", "updatedAt") FROM stdin;
cmm4swx6o0000oe0kc65s88m1	admin	ifman@yandex.ru	$2b$10$QQmyOZeCrzZdCkcUlN8Bde9FDRQ7r/n.9f9hmlSrFVRZ2vDnnwAL6	2026-02-27 11:20:51.457	2026-02-27 16:20:00.835
\.


--
-- Data for Name: admin_password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_password_reset_codes (id, "adminId", "codeHash", "expiresAt", "usedAt", "createdAt") FROM stdin;
cmm53kxph0005mq0l8nok82dr	cmm4swx6o0000oe0kc65s88m1	a1803fe815ebd94d8d3938ee1cadee23322ab1328c33986998bfb5576eb6d7a8	2026-02-27 16:34:28.031	2026-02-27 16:20:00.832	2026-02-27 16:19:28.037
\.


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, title, slug, content, tags, "authorId", "shortText", "catalogSlug", "publishedAt", "createdAt", "updatedAt") FROM stdin;
cmm241e7h0001my0ko2ehgp0c	sdg	sdg	<p><img style="max-width: 100%; height: auto;" src="/articles/files/article-cmm241e7h0001my0ko2ehgp0c/1771776651952_0f20b53ccb3e3dcb.webp" alt="1771776651952_0f20b53ccb3e3dcb.webp" loading="lazy"></p>\n<p>sdg</p>	{}	\N	dsg	\N	2026-02-25 15:42:42.681	2026-02-25 14:08:57.389	2026-02-25 15:42:42.682
cmm2cnpeb0000ub0j9v2oa9s2	sdgsdsdg	sdgsdsdg	<p><img style="max-width: 100%; height: auto;" src="/articles/files/article-draft-1772042988825-emv3lils/snimok-ekrana-2026-02-25-v-19-02-43.png" alt="snimok-ekrana-2026-02-25-v-19-02-43.png" loading="lazy"></p>\n<p>dskgdksgn</p>	{}	cmm245pvv0005my0kppjb191s	sdgnjsngj	\N	2026-02-25 18:10:15.25	2026-02-25 18:10:15.252	2026-02-25 18:10:15.252
\.


--
-- Data for Name: data_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_lists (id, slug, name, items, "createdAt", "updatedAt") FROM stdin;
cmm24199f0000my0kqj5zuplc	article-tags	Тэги статей	[]	2026-02-25 14:08:50.98	2026-02-25 14:08:50.98
cmm244vje0002my0k9g8ju5v4	paradigms	Парадигмы	["Консультирование", "КПТ", "Гештальт-терапия", "Психодинамическая терапия", "Экзистенциальная терапия", "Семейная системная терапия", "Транзактный анализ", "Схема-терапия", "ACT", "CFT", "DBT", "EMDR", "MBCT", "Телесно-ориентированная психотерапия", "Арт-терапия", "Эриксоновская терапия", "Клиент-центрированная терапия"]	2026-02-25 14:11:39.818	2026-02-25 14:11:39.818
cmm244voh0003my0kmpuxz2ks	work-formats	Форматы работы	["Онлайн и оффлайн", "Только онлайн", "Только оффлайн", "Переписка"]	2026-02-25 14:11:40.002	2026-02-25 14:11:40.002
cmm244vt90004my0kguup6c4p	certification-levels	Уровни сертификации	["1", "2", "3"]	2026-02-25 14:11:40.174	2026-02-25 14:11:40.174
cmm25nf030000qw0k3ybpwyfc	site-header-menu	Site Header Menu	[{"id": "menu-psy-list", "href": "/psy-list", "label": "Подобрать психолога"}, {"id": "menu-lib-articles", "href": "/lib/articles", "label": "Статьи"}, {"id": "menu-connect", "href": "/connect", "label": "Для психологов"}, {"id": "menu-contacts", "href": "/contacts", "label": "Контакты"}]	2026-02-25 14:54:04.465	2026-02-25 14:54:04.465
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (id, label, href, "order", "parentId") FROM stdin;
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, slug, title, template, content, images, "showHeader", "showFooter", "isPublished", "createdAt", "updatedAt") FROM stdin;
cmm250ccn0001a23ce3rbq8av	connect	Страница Connect	empty	<div class="min-h-screen bg-gradient-to-b from-white to-lime-50/20"><div class="relative overflow-hidden border-b border-gray-200"><div class="absolute inset-0 z-0"><div class="relative h-full w-full"><img alt="Психологи в реестре Давай вместе" decoding="async" data-nimg="fill" class="object-cover object-center" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="100vw" src="/images/image-doctor.png"/><div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div></div></div><div class="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32"><div class="text-center"><div class="mb-8 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-white/90 px-4 py-2 backdrop-blur-sm"><span class="h-2 w-2 animate-pulse rounded-full bg-lime-500"></span><span class="text-sm font-medium text-gray-800">Для психологов</span></div><h1 class="text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl">Присоединяйтесь к реестру<span class="mt-4 block text-lime-300">«Давай вместе»</span></h1><p class="mx-auto mt-8 max-w-2xl text-lg text-white/90 sm:text-xl">Место, где ваша практика встречает клиентов, которые ищут именно вас</p><div class="mt-12 flex flex-col justify-center gap-4 sm:flex-row"><a class="inline-flex items-center justify-center rounded-lg bg-lime-500 px-8 py-4 font-medium text-white shadow-lg transition-colors duration-200 hover:bg-lime-600 hover:shadow-xl" href="/contacts">Начать сотрудничество</a><a class="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 font-medium text-white transition-colors duration-200 hover:bg-white/10" href="/psy-list">Смотреть каталог</a></div></div></div></div><div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"><div class="mb-12 lg:mb-16"><div class="mb-6 flex items-center gap-4"><div class="h-1 w-12 rounded-full bg-lime-500"></div><h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">Почему выбирают нас</h2></div><p class="max-w-3xl text-lg text-gray-600">Более 800 психологов уже доверили нам свою практику</p></div><div class="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">🎯</div><h3 class="mb-4 text-xl font-bold text-gray-900">Качественный трафик</h3><p class="leading-relaxed text-gray-600">Клиенты приходят с конкретными запросами и готовы к работе.</p></div></div><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">📊</div><h3 class="mb-4 text-xl font-bold text-gray-900">Прозрачная аналитика</h3><p class="leading-relaxed text-gray-600">Понимайте, как клиенты находят вас и что для них важно.</p></div></div><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">🛡️</div><h3 class="mb-4 text-xl font-bold text-gray-900">Защита репутации</h3><p class="leading-relaxed text-gray-600">Проверенная платформа добавляет вес вашим сертификатам.</p></div></div><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">🚀</div><h3 class="mb-4 text-xl font-bold text-gray-900">Быстрый старт</h3><p class="leading-relaxed text-gray-600">От заявки до первой анкеты — за 72 часа.</p></div></div><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">💎</div><h3 class="mb-4 text-xl font-bold text-gray-900">Премиум-позиционирование</h3><p class="leading-relaxed text-gray-600">Выделяйтесь среди коллег профессиональным оформлением.</p></div></div><div class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-xl sm:p-8"><div class="absolute inset-0 bg-gradient-to-br from-white to-lime-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div><div class="relative z-10"><div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-lime-100 text-2xl transition-transform duration-300 group-hover:scale-110">🤝</div><h3 class="mb-4 text-xl font-bold text-gray-900">Сопровождение</h3><p class="leading-relaxed text-gray-600">Помощь в оформлении и продвижении вашего профиля.</p></div></div></div></div><div class="bg-gradient-to-b from-lime-50/30 to-white py-16 sm:py-20 lg:py-24"><div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"><div class="mb-12 lg:mb-16"><div class="mb-6 flex items-center gap-4"><div class="h-1 w-12 rounded-full bg-[#5858E2]"></div><h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">Как присоединиться</h2></div><p class="max-w-3xl text-lg text-gray-600">Простой путь от знакомства до первых клиентов</p></div><div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4"><div class="relative group"><div class="relative h-full rounded-2xl border-l-4 border-t border-r border-b border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-lg sm:p-8"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5858E2] text-lg font-bold text-white">1</div><div class="flex-1"><h3 class="mb-3 text-xl font-bold text-gray-900">Знакомство</h3><p class="mb-4 text-gray-600">Расскажите о своей практике в формате короткого интервью.</p><div class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">Срок: <!-- -->1-2 дня</div></div></div></div></div><div class="relative group"><div class="relative h-full rounded-2xl border-l-4 border-t border-r border-b border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-lg sm:p-8"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5858E2] text-lg font-bold text-white">2</div><div class="flex-1"><h3 class="mb-3 text-xl font-bold text-gray-900">Верификация</h3><p class="mb-4 text-gray-600">Проверка документов и оценка уровня сертификации.</p><div class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">Срок: <!-- -->1-2 дня</div></div></div></div></div><div class="relative group"><div class="relative h-full rounded-2xl border-l-4 border-t border-r border-b border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-lg sm:p-8"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5858E2] text-lg font-bold text-white">3</div><div class="flex-1"><h3 class="mb-3 text-xl font-bold text-gray-900">Оформление</h3><p class="mb-4 text-gray-600">Создание уникальной анкеты с акцентами на ваши сильные стороны.</p><div class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">Срок: <!-- -->1-2 дня</div></div></div></div></div><div class="relative group"><div class="relative h-full rounded-2xl border-l-4 border-t border-r border-b border-gray-200 bg-white p-6 transition-all duration-300 hover:border-lime-300 hover:shadow-lg sm:p-8"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5858E2] text-lg font-bold text-white">4</div><div class="flex-1"><h3 class="mb-3 text-xl font-bold text-gray-900">Запуск</h3><p class="mb-4 text-gray-600">Размещение в каталоге и первые показы целевой аудитории.</p><div class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">Срок: <!-- -->1-2 дня</div></div></div></div></div></div></div></div><div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"><div class="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white sm:p-12"><div class="relative z-10"><div class="mb-8 lg:mb-12"><div class="mb-6 flex items-center gap-4"><div class="h-1 w-12 rounded-full bg-lime-400"></div><h2 class="text-3xl font-bold text-white sm:text-4xl">Уровни сертификации</h2></div><p class="max-w-3xl text-lg text-gray-300">Прозрачная система, которая помогает клиентам понять ваш уровень</p></div><div class="grid gap-8 lg:grid-cols-2 lg:gap-12"><div><div class="space-y-6"><div class="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors duration-200 hover:bg-white/10"><div class="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold bg-lime-500">1</div><div class="flex-1"><div class="mb-2 text-xl font-bold">Базовый</div><div class="text-gray-400">Начальная практика</div></div></div><div class="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors duration-200 hover:bg-white/10"><div class="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold bg-[#5858E2]">2</div><div class="flex-1"><div class="mb-2 text-xl font-bold">Продвинутый</div><div class="text-gray-400">Стабильная практика</div></div></div><div class="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors duration-200 hover:bg-white/10"><div class="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold bg-amber-500">3</div><div class="flex-1"><div class="mb-2 text-xl font-bold">Экспертный</div><div class="text-gray-400">Глубокий опыт</div></div></div></div><div class="mt-10"><a class="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-medium text-gray-900 transition-colors duration-200 hover:bg-gray-100" href="/certification-levels">Подробнее о критериях<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></a></div></div><div><div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"><h4 class="mb-8 text-2xl font-bold">Критерии оценки</h4><div class="space-y-8"><div><div class="mb-3 flex items-center justify-between"><span class="text-lg">Опыт практики</span><span class="text-xl font-bold">85%</span></div><div class="h-3 w-full overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full transition-all duration-1000 ease-out bg-lime-500" style="width:85%"></div></div></div><div><div class="mb-3 flex items-center justify-between"><span class="text-lg">Образование</span><span class="text-xl font-bold">90%</span></div><div class="h-3 w-full overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full transition-all duration-1000 ease-out bg-[#5858E2]" style="width:90%"></div></div></div><div><div class="mb-3 flex items-center justify-between"><span class="text-lg">Супервизия</span><span class="text-xl font-bold">75%</span></div><div class="h-3 w-full overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full transition-all duration-1000 ease-out bg-amber-500" style="width:75%"></div></div></div></div></div></div></div></div></div></div><div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"><div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5858E2] via-[#5858E2] to-lime-500 p-8 text-center text-white sm:p-12"><div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div><div class="relative z-10"><h2 class="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">Начните сейчас</h2><p class="mx-auto mb-10 max-w-2xl text-lg text-white/90 sm:text-xl">Первая консультация бесплатно. Обсудим, как реестр поможет именно вам.</p><div class="flex flex-col items-center justify-center gap-4 sm:flex-row"><a class="inline-flex w-full items-center justify-center rounded-xl bg-white px-10 py-4 font-medium text-[#5858E2] shadow-lg transition-all duration-200 hover:bg-gray-100 hover:shadow-xl sm:w-auto" href="/contacts">Записаться на консультацию</a><a class="inline-flex w-full items-center justify-center rounded-xl border-2 border-white px-10 py-4 font-medium text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto" href="/psy-list">Примеры анкет</a></div><div class="mt-12 border-t border-white/20 pt-8"><p class="flex items-center justify-center gap-2 text-base text-white/80"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>Отвечаем в течение 4 часов</p></div></div></div></div></div>	{}	f	f	t	2026-02-25 14:36:07.943	2026-02-25 14:36:07.943
cmm250ccq0002a23c6a36j29o	site-footer	Футер сайта	empty	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">\n  <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8">\n    <div class="text-center sm:text-left">\n      <div class="text-xl font-bold text-gray-900">Давай вместе</div>\n      <div class="mt-1 text-xs font-medium text-lime-600">реестр психологов</div>\n    </div>\n\n    <nav class="flex flex-wrap justify-center gap-6">\n      <a href="/" class="text-sm text-gray-600 hover:text-gray-900">Главная</a>\n      <a href="/psy-list" class="text-sm text-gray-600 hover:text-gray-900">Каталог</a>\n      <a href="/lib" class="text-sm text-gray-600 hover:text-gray-900">Библиотека</a>\n      <a href="/connect" class="text-sm text-gray-600 hover:text-gray-900">Для психологов</a>\n      <a href="/contacts" class="text-sm text-gray-600 hover:text-gray-900">Контакты</a>\n    </nav>\n  </div>\n\n  <div class="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>\n\n  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">\n    <div class="flex flex-wrap justify-center gap-4 text-xs">\n      <a href="/privacy" class="text-gray-500 hover:text-gray-700">Конфиденциальность</a>\n      <a href="/complaint" class="text-gray-500 hover:text-gray-700">Пожаловаться</a>\n      <a href="/faq" class="text-gray-500 hover:text-gray-700">FAQ</a>\n    </div>\n\n    <div class="text-center sm:text-right">\n      <p class="text-xs text-gray-500">© {{year}} Давай вместе. Каталог психологов.</p>\n      <p class="mt-1 text-xs text-gray-400">Подбор по парадигме, цене и городу.</p>\n    </div>\n  </div>\n\n  <div class="mt-6 flex justify-center">\n    <div class="flex items-center gap-2">\n      <div class="h-px w-4 bg-gray-300"></div>\n      <div class="h-1 w-1 rounded-full bg-lime-500"></div>\n      <div class="h-px w-4 bg-gray-300"></div>\n    </div>\n  </div>\n</div>	{}	f	f	t	2026-02-25 14:36:07.946	2026-02-25 14:36:07.946
cmm26uigq0001qw0kv0dqanru	sdgdsg	sdggs	empty	<h1>sgdg</h1>	{}	f	f	t	2026-02-25 15:27:35.162	2026-02-25 15:27:44.133
cmm250cct0003a23c2ia7as4h	home	Главная страница	empty	<div><section class="relative overflow-hidden border-b-4 border-[#5858E2] bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12"><div class="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#A7FF5A]/30 blur-3xl sm:h-64 sm:w-64" aria-hidden="true"></div><div class="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#5858E2]/20 blur-3xl sm:h-48 sm:w-48" aria-hidden="true"></div><div class="relative mx-auto max-w-6xl"><div class="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-14"><div class="min-w-0"><span class="inline-block rounded-full bg-[#A7FF5A] px-3 py-1 text-xs font-semibold text-foreground sm:px-4 sm:py-1.5 sm:text-sm">Реестр психологов</span><h1 class="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">Находим своего психолога вместе</h1><p class="mt-4 max-w-xl text-sm leading-relaxed text-neutral-dark sm:mt-5 sm:text-base md:text-lg">«Давай вместе» — реестр психологов с прозрачной сертификацией. Подбор по подходу, цене, городу и уровню подготовки. Образование и дипломы видны в каждой анкете.</p><p class="mt-2 max-w-xl text-sm leading-relaxed text-neutral-dark sm:mt-3 sm:text-base md:text-lg">Мы не продаём консультации — помогаем найти специалиста, с которым будет комфортно и безопасно работать.</p><ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-foreground sm:mt-6 sm:gap-x-6 sm:gap-y-2 sm:text-sm md:text-base"><li class="flex items-center gap-1.5 sm:gap-2"><span class="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2"></span> Фильтры по цене, методу, городу</li><li class="flex items-center gap-1.5 sm:gap-2"><span class="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2"></span> Три уровня сертификации</li><li class="flex items-center gap-1.5 sm:gap-2"><span class="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2"></span> Дипломы и курсы в каждой анкете</li></ul><div class="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4"><a class="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#4848d0] sm:px-6 sm:py-3.5 sm:text-base" href="/psy-list">Подобрать психолога</a><a class="inline-block rounded-xl border-2 border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-5 sm:py-3 sm:text-base" href="/certification-levels">Уровни сертификации</a></div></div><div class="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-xl border-4 border-[#A7FF5A] bg-white shadow-xl sm:aspect-[16/11] sm:min-h-[260px] sm:rounded-2xl lg:aspect-[4/3] lg:min-h-[320px] xl:aspect-[16/11] xl:min-h-[360px]"><img alt="Подбор психолога: карточки специалистов" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1536px) 46vw, 620px" src="/images/hero.png"/></div></div></div></section><section class="bg-gradient-to-b from-white to-gray-50/30 py-12 md:py-16"><div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div class="mb-10 text-center md:mb-12"><div class="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5858E2]/20 bg-white px-4 py-2"><span class="h-1.5 w-1.5 rounded-full bg-[#5858E2] animate-pulse"></span><span class="text-sm font-semibold text-[#5858E2]">Доверие и гарантии</span></div><h2 class="text-2xl font-bold text-gray-900 md:text-3xl">Почему наш реестр —<span class="text-[#5858E2]"> знак качества</span></h2><p class="mx-auto mt-3 max-w-2xl text-gray-600 md:text-lg">Строгие критерии, проверенные специалисты и постоянный контроль</p></div><div class="grid gap-8 lg:grid-cols-5 lg:gap-10"><div class="lg:col-span-2"><div class="rounded-2xl bg-gradient-to-br from-[#5858E2] to-[#5858E2]/90 p-6 text-white md:p-8"><h3 class="mb-6 text-lg font-semibold md:text-xl">Наши показатели</h3><div class="space-y-6"><div class="border-b border-white/20 pb-6"><div class="text-3xl font-bold md:text-4xl">50+</div><div class="mt-1 text-white/90">специалистов в реестре</div><div class="mt-2 text-sm text-white/70">От психологов-стажеров до экспертов с опытом 10+ лет</div></div><div class="border-b border-white/20 pb-6"><div class="flex items-center gap-2"><div class="text-3xl font-bold md:text-4xl">3</div><div class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">уровня сертификации</div></div><div class="mt-1 text-white/90">четкая система оценки</div><div class="mt-2 text-sm text-white/70">От базового до экспертного уровня по единым стандартам</div></div><div><div class="text-3xl font-bold md:text-4xl">100%</div><div class="mt-1 text-white/90">проверенных документов</div><div class="mt-2 text-sm text-white/70">Дипломы, сертификаты, личная терапия — всё проверяется</div></div></div></div></div><div class="lg:col-span-3"><div class="grid gap-6"><div class="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#5858E2]/40 hover:shadow-md md:p-6"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5858E2]/10 text-[#5858E2]"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div><div><h3 class="font-semibold text-gray-900">Многоэтапный отбор</h3><p class="mt-1.5 text-gray-600">Анкетирование + интервью + проверка документов + оценка уровня</p></div></div></div><div class="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#5858E2]/40 hover:shadow-md md:p-6"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5858E2]/10 text-[#5858E2]"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><h3 class="font-semibold text-gray-900">Проверенные дипломы</h3><p class="mt-1.5 text-gray-600">Все образовательные документы проходят ручную проверку</p></div></div></div><div class="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#5858E2]/40 hover:shadow-md md:p-6"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5858E2]/10 text-[#5858E2]"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><h3 class="font-semibold text-gray-900">Супервизия и терапия</h3><p class="mt-1.5 text-gray-600">Обязательная личная терапия и регулярная супервизия</p></div></div></div></div><div class="mt-6 grid gap-4 sm:grid-cols-2"><div class="rounded-xl bg-[#A7FF5A]/10 border border-[#A7FF5A]/30 p-4"><div class="flex items-center gap-2"><svg class="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg><span class="text-sm font-medium text-gray-900">Ежеквартальный контроль</span></div><p class="mt-2 text-xs text-gray-600">Проверяем актуальность данных и собираем отзывы клиентов</p></div><div class="rounded-xl bg-gray-50 border border-gray-200 p-4"><div class="flex items-center gap-2"><svg class="h-4 w-4 text-[#5858E2]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg><span class="text-sm font-medium text-gray-900">Гарантия качества</span></div><p class="mt-2 text-xs text-gray-600">Каждый психолог отвечает нашим строгим профессиональным стандартам</p></div></div><div class="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-white p-5 border border-gray-200"><p class="text-center text-sm font-medium text-gray-900"><span class="text-[#5858E2]">✓</span> Выбирайте проверенных специалистов с гарантией качества</p></div></div></div><div class="mt-10"><div class="relative overflow-hidden rounded-2xl mx-auto max-w-6xl"><div class="aspect-[4/3] sm:aspect-[16/6.5] lg:aspect-[16/4.5]"> <img alt="Профессиональная психологическая консультация в доверительной обстановке" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 640px) 100vw, (max-width: 768px) 95vw, (max-width: 1024px) 90vw, (max-width: 1536px) 72vw, 60vw" src="/images/image-5.jpg"/><div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent sm:bg-gradient-to-r sm:from-black/30 sm:via-black/10 sm:to-transparent"></div><div class="absolute inset-0 flex items-end sm:items-center"><div class="px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-16 w-full"><div class="max-w-full sm:max-w-2xl lg:max-w-3xl"><div class="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 sm:px-4 sm:py-1.5 lg:px-5 lg:py-2 backdrop-blur-sm"><span class="text-xs sm:text-sm lg:text-base font-medium text-green-400">Доверие</span></div><h3 class="text-xl font-bold text-white sm:text-2xl lg:text-4xl">Профессионализм, проверенный временем</h3><p class="mt-2 text-white/90 text-sm sm:text-base lg:text-lg">Наши психологи проходят строгий отбор и регулярно повышают квалификацию</p></div></div></div></div></div></div></div></section><div class="bg-white py-32"><div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"><div class="mb-20"><div class="flex items-center gap-4 mb-6"><div class="h-px w-16 bg-[#5858E2]"></div><div class="text-lg font-medium text-gray-900">Принципы, которые не нарушаем</div></div><h2 class="text-5xl font-bold text-gray-900 leading-tight">Почему наш реестр <br/><span class="text-[#5858E2]">вызывает доверие</span></h2></div><div class="space-y-20"><div class="relative"><div class="absolute -left-8 top-0 text-8xl font-bold text-gray-900/10">01</div><div class="flex items-center gap-4 mb-6"><div class="w-4 h-4 rounded-full" style="background-color:#5858E2"></div><h3 class="text-2xl font-bold text-gray-900">Абсолютная прозрачность</h3></div><p class="text-lg text-gray-700 leading-relaxed max-w-3xl">Все дипломы, сертификаты, пройденные курсы и супервизии доступны для просмотра. Вы видите реальный бэкграунд психолога, а не общие фразы.</p><div class="mt-20 h-px bg-[#BFBFBF]"></div></div><div class="relative"><div class="absolute -left-8 top-0 text-8xl font-bold text-gray-900/10">02</div><div class="flex items-center gap-4 mb-6"><div class="w-4 h-4 rounded-full" style="background-color:#A7FF5A"></div><h3 class="text-2xl font-bold text-gray-900">Многоэтапная проверка</h3></div><p class="text-lg text-gray-700 leading-relaxed max-w-3xl">Документы → личное интервью → оценка практики. Каждый этап — фильтр. Только треть кандидатов проходит все стадии.</p><div class="mt-20 h-px bg-[#BFBFBF]"></div></div><div class="relative"><div class="absolute -left-8 top-0 text-8xl font-bold text-gray-900/10">03</div><div class="flex items-center gap-4 mb-6"><div class="w-4 h-4 rounded-full" style="background-color:#5858E2"></div><h3 class="text-2xl font-bold text-gray-900">Человечный подход</h3></div><p class="text-lg text-gray-700 leading-relaxed max-w-3xl">Фильтры по реальным параметрам: цена, проблема, метод. И статьи от психологов — чтобы понять, как они мыслят.</p></div></div><div class="mt-24 pt-8 border-t border-[#BFBFBF]"><div class="flex justify-between items-center"><div class="text-sm text-gray-500">Эти принципы не обсуждаются</div><div class="text-sm font-medium text-[#5858E2]">Работаем так с 2021 года</div></div></div></div></div><section class="border-t border-neutral-200 bg-white px-4 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-12"><div class="mx-auto max-w-6xl"><h2 class="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Как это работает</h2><p class="mt-2 text-sm text-neutral-dark sm:mt-3 sm:text-base md:text-lg">Подбор в три шага: фильтры → карточки → контакт. Бесплатно для клиента.</p><div class="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6"><div class="flex flex-col rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 sm:p-5"><span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#5858E2] font-display text-base font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-lg">1</span><h3 class="mt-2 font-display text-base font-semibold text-foreground sm:mt-3 sm:text-lg">Задайте фильтры</h3><p class="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-dark sm:mt-2 sm:text-sm">Парадигма, цена, город, уровень сертификации. Сортировка по цене или уровню.</p></div><div class="flex flex-col rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 sm:p-5"><span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#5858E2] font-display text-base font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-lg">2</span><h3 class="mt-2 font-display text-base font-semibold text-foreground sm:mt-3 sm:text-lg">Смотрите карточки</h3><p class="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-dark sm:mt-2 sm:text-sm">Фото, краткое «о себе», метод, уровень, дипломы и курсы. «Подробнее» — полная анкета с образованием и контактами.</p></div><div class="flex flex-col rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 sm:p-5"><span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#5858E2] font-display text-base font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-lg">3</span><h3 class="mt-2 font-display text-base font-semibold text-foreground sm:mt-3 sm:text-lg">Свяжитесь со специалистом</h3><p class="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-dark sm:mt-2 sm:text-sm">Контакты в анкете. Дальнейшее общение — напрямую с психологом. Мы не ведём запись и не берём комиссию.</p></div></div><div class="mt-6 text-center sm:mt-8"><a class="inline-block rounded-xl border border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-5 sm:py-2.5 sm:text-base" href="/psy-list">Открыть каталог</a></div></div></section><section class="relative overflow-hidden border-y-4 border-[#A7FF5A]/50 bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12"><div class="absolute left-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#5858E2]/10 blur-3xl sm:h-72 sm:w-72" aria-hidden="true"></div><div class="relative mx-auto max-w-6xl"><div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12"><div class="min-w-0 flex-1"><h2 class="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl">Подобрать психолога</h2><p class="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">В каталоге — все психологи реестра. Задайте критерии, нажмите «Найти» — получите список анкет. У каждого указаны фото, краткое «о себе», метод, уровень, количество дипломов и курсов.</p><div class="mt-6 rounded-xl border-2 border-[#5858E2]/30 bg-white/80 p-4 shadow-lg sm:mt-8 sm:rounded-2xl sm:p-6"><p class="font-semibold text-foreground sm:text-base">Фильтры каталога:</p><ul class="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2"><li class="flex items-center gap-2 text-sm text-neutral-dark sm:text-base"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]"></span> <!-- -->Стоимость сессии (от и до)</li><li class="flex items-center gap-2 text-sm text-neutral-dark sm:text-base"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]"></span> <!-- -->Метод работы (КПТ, гештальт и др.)</li><li class="flex items-center gap-2 text-sm text-neutral-dark sm:text-base"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]"></span> <!-- -->Город и пол</li><li class="flex items-center gap-2 text-sm text-neutral-dark sm:text-base"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]"></span> <!-- -->Уровень сертификации (1–3)</li><li class="flex items-center gap-2 text-sm text-neutral-dark sm:text-base"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]"></span> <!-- -->Сортировка по цене или дате</li></ul></div><div class="mt-6 flex flex-wrap gap-3 sm:mt-10 sm:gap-4"><a class="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#4848d0] sm:px-6 sm:py-3.5 sm:text-base" href="/psy-list">Перейти в каталог</a><a class="inline-block rounded-xl border-2 border-[#A7FF5A] bg-[#A7FF5A]/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[#A7FF5A]/40 sm:px-5 sm:py-3 sm:text-base" href="/certification-levels">Что такое уровни?</a></div></div><div class="relative h-52 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#5858E2]/30 bg-white sm:h-60 lg:h-64 lg:w-96 xl:h-72 xl:w-[430px] 2xl:h-80 2xl:w-[460px]"><img alt="Каталог психологов: подбор по фильтрам" loading="lazy" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 384px, (max-width: 1536px) 430px, 460px" src="/images/image-4.JPG"/></div></div></div></section><section class="border-t border-neutral-200 bg-white px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12"><div class="mx-auto max-w-6xl"><div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12"><div class="min-w-0 flex-1"><h2 class="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Для психологов</h2><p class="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">Реестр «Давай вместе» — возможность быть видимым для клиентов с понятными критериями сертификации. Анкета в каталоге с фильтрами, статьи в библиотеке с авторством и ссылкой на анкету.</p><p class="mt-4 text-sm text-neutral-dark sm:mt-6 sm:text-base">Как попасть в реестр и что нужно — в разделе «Для психологов». Там же — про уровни сертификации и порядок вступления.</p><p class="mt-2 text-xs text-neutral-dark sm:text-sm">Реестр даёт видимость для клиентов, которые ищут проверенных специалистов с понятными критериями.</p><div class="mt-6 sm:mt-10"><a class="inline-block rounded-xl border-2 border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-6 sm:py-3 sm:text-base" href="/connect">Подробнее для психологов</a></div><p class="mt-4 text-xs text-neutral-dark sm:text-sm">Уровни сертификации: <a class="text-[#5858E2] underline hover:no-underline" href="/certification-levels">что это и как пройти</a></p></div><div class="relative h-52 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#A7FF5A]/50 bg-[#F5F5F7] sm:h-60 lg:h-64 lg:w-80 xl:h-72 xl:w-[360px] 2xl:h-80 2xl:w-[400px]"><img alt="Для психологов: присоединиться к реестру" loading="lazy" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 320px, (max-width: 1536px) 360px, 400px" src="/images/image-doctor.png"/></div></div></div></section><section class="bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12"><div class="mx-auto max-w-6xl"><div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12"><div class="relative h-56 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#5858E2]/20 bg-white sm:h-64 lg:order-2 lg:h-72 lg:w-80 xl:h-80 xl:w-[360px] 2xl:h-[22rem] 2xl:w-[400px]"><img alt="Библиотека статей от психологов" loading="lazy" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 320px, (max-width: 1536px) 360px, 400px" src="/images/image-3.jpg"/></div><div class="min-w-0 flex-1 lg:order-1"><h2 class="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Библиотека</h2><p class="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">Тематические статьи от психологов реестра: не реклама, а материалы о психике, терапии и выборе специалиста. У каждой статьи указан автор — можно перейти на его анкету.</p><p class="mt-2 text-xs text-neutral-dark sm:text-sm">Фильтр по тегам, хронологический порядок. Статьи помогают сориентироваться в подходах и темах до обращения к специалисту.</p><div class="mt-6 flex flex-wrap gap-3 sm:mt-10 sm:gap-4"><a class="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#4848d0] sm:px-6 sm:py-3 sm:text-base" href="/lib">В библиотеку</a><a class="inline-block rounded-xl border-2 border-[#A7FF5A] bg-[#A7FF5A]/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[#A7FF5A]/40 sm:px-6 sm:py-3 sm:text-base" href="/lib/articles">Все статьи</a></div></div></div></div></section><section class="border-t-4 border-[#A7FF5A] bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-12"><div class="mx-auto max-w-4xl rounded-xl border-4 border-[#5858E2]/30 bg-[#5858E2] px-4 py-10 text-center shadow-xl sm:rounded-2xl sm:px-6 sm:py-12 md:px-10 md:py-14"><h2 class="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">Найди своего психолога</h2><p class="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:mt-4 sm:text-base md:text-lg">Открой каталог, задай фильтры по подходу, цене и уровню — выбери специалиста.</p><div class="mt-6 sm:mt-8"><a class="inline-block rounded-xl bg-[#A7FF5A] px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg hover:bg-[#8ee64a] sm:px-6 sm:py-3 sm:text-base" href="/psy-list">Подобрать психолога</a></div><p class="mt-6 text-xs text-white/80 sm:mt-8 sm:text-sm">Вопросы: <a href="https://t.me/psy_smirnov" target="_blank" rel="noopener noreferrer" class="underline hover:no-underline">Telegram @psy_smirnov</a> · <a class="underline hover:no-underline" href="/contacts">Контакты</a></p></div></section></div>	{}	f	f	t	2026-02-25 14:36:07.949	2026-02-25 18:17:57.096
cmm250cby0000a23c4kgy4nhh	catalog-page	Страница каталога	empty	{"version":1,"topHtml":"<!--<section class=\\"relative overflow-hidden border-b border-gray-200 bg-white\\">\\r\\n  <div class=\\"absolute left-0 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5858E2]/10 blur-3xl\\" aria-hidden=\\"true\\"></div>\\r\\n  <div class=\\"absolute right-0 bottom-0 h-48 w-48 translate-x-1/2 translate-y-1/2 rounded-full bg-lime-500/10 blur-3xl\\" aria-hidden=\\"true\\"></div>\\r\\n  <div class=\\"relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8\\">\\r\\n    <div class=\\"text-center\\">\\r\\n      <h1 class=\\"text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl\\">\\r\\n        Найдите <span class=\\"text-[#5858E2]\\">психолога</span>\\r\\n      </h1>\\r\\n      <p class=\\"mx-auto mt-6 max-w-2xl text-lg text-gray-700\\">\\r\\n        Подбор специалистов по направлениям терапии, стоимости и опыту работы\\r\\n      </p>\\r\\n    </div>\\r\\n  </div>\\r\\n</section>-->","bottomHtml":"<section class=\\"border-t border-gray-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8\\">\\r\\n  <div class=\\"mx-auto grid max-w-7xl gap-8 lg:grid-cols-3\\">\\r\\n    <div class=\\"rounded-2xl border border-gray-200 bg-gray-50 p-6\\">\\r\\n      <h3 class=\\"text-lg font-semibold text-gray-900\\">Проверенные специалисты</h3>\\r\\n      <p class=\\"mt-2 text-sm text-gray-600\\">\\r\\n        Все психологи проходят проверку документов и квалификации.\\r\\n      </p>\\r\\n    </div>\\r\\n    <div class=\\"rounded-2xl border border-gray-200 bg-gray-50 p-6\\">\\r\\n      <h3 class=\\"text-lg font-semibold text-gray-900\\">Уровни сертификации</h3>\\r\\n      <p class=\\"mt-2 text-sm text-gray-600\\">\\r\\n        Прозрачная система оценки опыта и профессиональной подготовки.\\r\\n      </p>\\r\\n    </div>\\r\\n    <div class=\\"rounded-2xl border border-gray-200 bg-gray-50 p-6\\">\\r\\n      <h3 class=\\"text-lg font-semibold text-gray-900\\">Помощь с выбором</h3>\\r\\n      <p class=\\"mt-2 text-sm text-gray-600\\">\\r\\n        Если сложно выбрать, свяжитесь с нами и мы подскажем.\\r\\n      </p>\\r\\n    </div>\\r\\n  </div>\\r\\n</section>"}	{}	f	f	t	2026-02-25 14:36:07.918	2026-02-25 19:27:41.93
cmm27c4mb0000k30lgg3fruyo	sdfs	adzv	text	<img src="https://dvmeste.ru/pages/files/page-draft-1772034055698-5tfjujz5/1771776651952_0f20b53ccb3e3dcb.webp"/>	{/pages/files/page-draft-1772034055698-5tfjujz5/1771776651952_0f20b53ccb3e3dcb.webp}	f	f	t	2026-02-25 15:41:17.027	2026-02-25 19:28:57.853
\.


--
-- Data for Name: psychologists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologists (id, slug, "fullName", gender, "birthDate", city, "workFormat", "firstDiplomaDate", "lastCertificationDate", "mainParadigm", "certificationLevel", "shortBio", "longBio", price, "contactInfo", "isPublished", education, images, "createdAt", "updatedAt") FROM stdin;
cmm245pvv0005my0kppjb191s	gasan-alievich-gasanov	Gasan Alievich Gasanov	М	2026-02-13	Москва	Только онлайн	2026-02-15	2026-02-10	{Консультирование,КПТ,Гештальт-терапия}	3	sdjgkskjbgabsdlgbsd	ds gjasbgjbsbdkbgskg	35000	23r2sgd\r\nsdgdsg	t	[{"year":"2015","type":"сертификат","organization":"jakalunkachev@gmail.com","title":"выаы","isDiploma":true}]	{/uploads/1772030300274_458fc6d62db371cc.webp,/uploads/1772034044739_408019fab6f82d6d.webp}	2026-02-25 14:12:19.146	2026-02-25 18:05:57.916
\.


--
-- Name: Manager Manager_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Manager"
    ADD CONSTRAINT "Manager_pkey" PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_password_reset_codes admin_password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_password_reset_codes
    ADD CONSTRAINT admin_password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: data_lists data_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_lists
    ADD CONSTRAINT data_lists_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: psychologists psychologists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologists
    ADD CONSTRAINT psychologists_pkey PRIMARY KEY (id);


--
-- Name: Manager_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Manager_email_key" ON public."Manager" USING btree (email);


--
-- Name: admin_accounts_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX admin_accounts_email_key ON public.admin_accounts USING btree (email);


--
-- Name: admin_accounts_login_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX admin_accounts_login_key ON public.admin_accounts USING btree (login);


--
-- Name: admin_password_reset_codes_adminId_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "admin_password_reset_codes_adminId_expiresAt_idx" ON public.admin_password_reset_codes USING btree ("adminId", "expiresAt");


--
-- Name: admin_password_reset_codes_usedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "admin_password_reset_codes_usedAt_idx" ON public.admin_password_reset_codes USING btree ("usedAt");


--
-- Name: articles_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "articles_authorId_idx" ON public.articles USING btree ("authorId");


--
-- Name: articles_publishedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "articles_publishedAt_idx" ON public.articles USING btree ("publishedAt");


--
-- Name: articles_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX articles_slug_idx ON public.articles USING btree (slug);


--
-- Name: articles_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);


--
-- Name: data_lists_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX data_lists_slug_key ON public.data_lists USING btree (slug);


--
-- Name: pages_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);


--
-- Name: psychologists_certificationLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "psychologists_certificationLevel_idx" ON public.psychologists USING btree ("certificationLevel");


--
-- Name: psychologists_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psychologists_city_idx ON public.psychologists USING btree (city);


--
-- Name: psychologists_isPublished_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "psychologists_isPublished_idx" ON public.psychologists USING btree ("isPublished");


--
-- Name: psychologists_isPublished_price_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "psychologists_isPublished_price_idx" ON public.psychologists USING btree ("isPublished", price);


--
-- Name: psychologists_price_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psychologists_price_idx ON public.psychologists USING btree (price);


--
-- Name: psychologists_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX psychologists_slug_key ON public.psychologists USING btree (slug);


--
-- Name: psychologists_workFormat_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "psychologists_workFormat_idx" ON public.psychologists USING btree ("workFormat");


--
-- Name: admin_password_reset_codes admin_password_reset_codes_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_password_reset_codes
    ADD CONSTRAINT "admin_password_reset_codes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.admin_accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: articles articles_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.psychologists(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: menu_items menu_items_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LgDwb4q87vk2x933jkdwdAIaqGnGDpIqyAjYxTRG8yz0ZbDeRhUDj8bXSDI7B1T

