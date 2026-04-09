"use client";

import { useState, useEffect } from "react";
import { saveSecretCatalogSettings } from "@/lib/actions/secret-catalog";

interface SecretCatalogFormProps {
  initialOptIn: boolean;
  initialFreeSessions: number;
  initialPrice: number;
}

export function SecretCatalogForm({
  initialOptIn,
  initialFreeSessions,
  initialPrice,
}: SecretCatalogFormProps) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [freeSessions, setFreeSessions] = useState(initialFreeSessions);
  const [price, setPrice] = useState(initialPrice);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    const result = await saveSecretCatalogSettings(optIn, freeSessions, price);

    if (result.success) {
      setSaveStatus("success");
    } else {
      setSaveStatus("error");
    }

    setIsSaving(false);
  };

  return (
    <div className="mt-4 rounded-xl bg-[#f8f9fc] p-5">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Разместить мои данные в каталоге
      </h3>

      {/* Чекбокс optIn */}
      <label className="mb-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
        />
        <span className="text-sm text-gray-700">
          <strong>Показывать мои данные в этом каталоге</strong>
          <br />
          Я соглашаюсь предоставить минимум 1 бесплатную сессию для учеников школы
        </span>
      </label>

      {/* Поля ввода */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Бесплатных сессий для учеников я даю
          </label>
          <input
            type="number"
            min="0"
            value={freeSessions}
            onChange={(e) => setFreeSessions(parseInt(e.target.value) || 0)}
            disabled={!optIn}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Цена для учеников (₽)
          </label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            disabled={!optIn}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Кнопка и статус */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
        >
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>

        {saveStatus === "success" && (
          <span className="text-sm text-green-600">✓ Сохранено!</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-600">✗ Ошибка сохранения</span>
        )}
      </div>
    </div>
  );
}