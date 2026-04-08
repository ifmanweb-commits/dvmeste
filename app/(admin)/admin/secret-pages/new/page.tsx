import Link from "next/link";
import { createSecretPage } from "../actions";

export default function NewSecretPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Создать секретную страницу</h1>
          <p className="text-gray-500 mt-1">Заполните форму для создания новой страницы</p>
        </div>
        <Link
          href="/admin/secret-pages"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Назад к списку
        </Link>
      </div>

      <form
        action={createSecretPage}
        className="mx-auto max-w-2xl space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="slug"
            id="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="my-secret-page"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
          <p className="mt-1 text-xs text-gray-500">Только латинские буквы, цифры и дефисы</p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
        </div>

        <div>
          <label htmlFor="htmlFile" className="block text-sm font-medium text-gray-700 mb-1">
            HTML файл <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="htmlFile"
            id="htmlFile"
            accept=".html,.htm"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
          <p className="mt-1 text-xs text-gray-500">
            Внешние изображения из HTML будут автоматически скачаны и сохранены локально
          </p>
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
            Изображения
          </label>
          <input
            type="file"
            name="images"
            id="images"
            multiple
            accept="image/*"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
          <p className="mt-1 text-xs text-gray-500">
            Дополнительные изображения для страницы
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            Создать страницу
          </button>
          <Link
            href="/admin/secret-pages"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}