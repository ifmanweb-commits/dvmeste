"use client";

import { useState } from "react";
import Link from "next/link";
import AddImageToPage from "@/components/pages/AddImageToPage";
import { DeletePageButton } from "@/components/admin/DeletePageButton";
import { updatePage } from "@/lib/actions/admin-pages";

interface PageEditFormProps {
  page: any;
  isSystemPage: boolean;
  systemPage: any;
  currentPublicPath: string;
}

export default function PageEditForm({ 
  page, 
  isSystemPage, 
  systemPage, 
  currentPublicPath 
}: PageEditFormProps) {
  const [template, setTemplate] = useState(page.template);
  const [seoOpen, setSeoOpen] = useState(false);
  return (
    <form action={updatePage.bind(null, page.id)} className="mt-8 space-y-6">
      {isSystemPage && systemPage ? (
        <>
          <input type="hidden" name="adminTitle" value={systemPage.title} />
          <input type="hidden" name="slug" value={systemPage.slug} />
          <input type="hidden" name="template" value="empty" />
          <input type="hidden" name="isPublished" value="on" />
          <input type="hidden" name="showHeader" value={page.showHeader ? "on" : "off"} />
          <input type="hidden" name="showFooter" value={page.showFooter ? "on" : "off"} />

          <div className="rounded-xl border border-[#5858E2]/20 bg-[#5858E2]/5 p-4">
            <p className="text-sm font-semibold text-foreground">Системная страница</p>
            <p className="mt-1 text-xs text-neutral-dark">
              Slug и шаблон зафиксированы: <code className="rounded bg-white px-1 py-0.5">{systemPage.slug}</code>, шаблон <code className="rounded bg-white px-1 py-0.5">empty</code>.
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Название (для админки) *
            </label>
            <input
              type="text"
              name="adminTitle"
              required
              defaultValue={page.adminTitle}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Внутреннее название, видно только в админке
            </p>
          </div>

          {page.slug === "home" ? (
            // Для главной страницы — показываем только текст, без возможности редактирования
            <div>
                <label className="block text-sm font-medium text-foreground">
                URL-адрес
                </label>
                <div className="mt-1 p-3 bg-gray-100 rounded-lg text-gray-700 font-mono text-sm">
                / (главная страница)
                </div>
                <input type="hidden" name="slug" value="home" />
                <p className="mt-1 text-xs text-gray-500">
                Slug главной страницы зарезервирован и не может быть изменён
                </p>
            </div>
            ) : (
            // Для всех остальных страниц — обычное поле ввода
            <div>
                <label className="block text-sm font-medium text-foreground">
                URL-адрес
                <span className="ml-2 text-xs text-amber-600">только латиница, цифры, дефис, нижнее подчеркивание</span>
                </label>

                <div className="relative">
                <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={page.slug}
                    pattern="[a-z0-9\-_]+"
                    title="Только латиница, цифры, дефис и нижнее подчеркивание. Без пробелов!"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
                />

                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-gray-400">📌</span>
                    Будет доступно по адресу: <span className="font-mono text-[#5858E2] bg-[#5858E2]/5 px-1.5 py-0.5 rounded">
                    {currentPublicPath}
                    </span>
                </p>
                </div>
            </div>
            )}

          <div>
            <label className="block text-sm font-medium text-foreground">Шаблон</label>
            <select
              name="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
            >
              <option value="text">Текст</option>
              <option value="landing">Лендинг (с меню и футером)</option>
              <option value="blank">Пустой (без меню и футера)</option>
            </select>
          </div>
        </>
      )}

        {/* SEO настройки (для всех, кроме системных) */}
        {!isSystemPage && (
        <div className="border-t border-neutral-200 pt-6 mt-6">
            <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="flex items-center justify-between w-full text-left"
            >
            <h3 className="text-lg font-medium text-foreground">SEO настройки</h3>
            <svg
                className={`w-5 h-5 transition-transform ${seoOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            </button>
            
            {seoOpen && (
            <div className="mt-4 space-y-4">
                <div>
                <label className="block text-sm font-medium text-foreground">Meta Title</label>
                <input
                    type="text"
                    name="metaTitle"
                    defaultValue={page.metaTitle || ""}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Если не указано, используется название страницы
                </p>
                </div>

                <div>
                <label className="block text-sm font-medium text-foreground">Meta Description</label>
                <textarea
                    name="metaDescription"
                    rows={3}
                    defaultValue={page.metaDescription || ""}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-foreground">Meta Keywords</label>
                <input
                    type="text"
                    name="metaKeywords"
                    defaultValue={page.metaKeywords || ""}
                    placeholder="психолог, терапия, консультация"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-500">Ключевые слова через запятую</p>
                </div>

                <div>
                <label className="block text-sm font-medium text-foreground">Robots</label>
                <select
                    name="metaRobots"
                    defaultValue={page.metaRobots || "index, follow"}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
                >
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
                </div>
            </div>
            )}
        </div>
        )}

      {/* Файлы */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground mb-2">
          {isSystemPage ? "Файлы системной страницы" : "Добавить файлы для страницы"}
        </h3>
        <div className="w-full">
          <AddImageToPage initialImages={page.images ?? []} entityKey={`page-${page.id}`} />
        </div>
        <p className="mt-1 text-xs text-neutral-dark">
          Загрузите файлы — они сохранятся автоматически и будут доступны для вставки в HTML.
        </p>
      </div>

      {/* Контент */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          {isSystemPage ? "HTML-код страницы" : "Контент"}
        </label>
        <textarea
          name="content"
          rows={isSystemPage ? 22 : 12}
          defaultValue={page.content}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
        />
      </div>

      {/* Дополнительный код для head (только для blank/landing) */}
      {!isSystemPage && (template === "blank" || template === "landing") && (
        <div className="space-y-2 border-t border-neutral-200 pt-6 mt-6">
          <h3 className="text-lg font-medium text-foreground">Дополнительный код для &lt;head&gt;</h3>
          <textarea
            name="customHead"
            rows={6}
            defaultValue={page.customHead || ""}
            placeholder='<link href="https://fonts.googleapis.com/..." rel="stylesheet">'
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
          />
          <p className="text-xs text-gray-500">
            Код будет вставлен в секцию &lt;head&gt; (шрифты, мета-теги, стили). Работает только для шаблонов «Пустой» и «Лендинг».
          </p>
        </div>
      )}


      {/* Публикация (только для несистемных) */}
      {!isSystemPage && (
        <div className="flex items-center gap-2">
          <input type="hidden" name="isPublished" value="off" />
          <input
            type="checkbox"
            name="isPublished"
            id="isPublished"
            value="on"
            defaultChecked={page.isPublished}
            className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
            Опубликовать (показывать на сайте)
          </label>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          className="rounded-xl bg-[#5858E2] px-6 py-2 font-medium text-white hover:bg-[#4848d0] transition-colors"
        >
          Сохранить
        </button>
        <Link
          href={currentPublicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[#5858E2] px-6 py-2 font-medium text-[#5858E2] hover:bg-[#5858E2]/5 transition-colors"
        >
          Посмотреть
        </Link>
        <Link
          href="/admin/pages"
          className="rounded-xl border border-neutral-300 px-6 py-2 font-medium text-foreground hover:bg-[#F5F5F7] transition-colors"
        >
          Отмена
        </Link>
      </div>

      {/* Кнопка удаления (только для несистемных) */}
        {!isSystemPage && page.slug !== "home" && (
        <div className="mt-6 border-t border-neutral-200 pt-6">
            <p className="mb-2 text-sm text-neutral-dark">Удаление страницы необратимо.</p>
            <DeletePageButton id={page.id} />
        </div>
        )}
    </form>
  );
}