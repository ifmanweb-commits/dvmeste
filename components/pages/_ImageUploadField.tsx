"use client";

import { useState } from "react";

interface Props {
  onUploaded?: (url: string) => void;
}

export default function ImageUploadField({ onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setUploadedUrl("");
    try {
      const formData = new FormData();
      formData.append("file", file);
                                             
      const isAdmin = window.location.pathname.includes("/admin/");
      const endpoint = isAdmin
        ? "/api/admin/pages/upload"
        : "/api/managers/pages/upload";
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setUploadedUrl(data.url);
      onUploaded?.(data.url);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Добавить изображение для страницы
      </label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-[#4CAF50] file:px-4 file:py-2 file:text-white hover:file:bg-[#43A047]"
      />
      {uploading && <p className="text-sm text-gray-500">Загрузка...</p>}
      {uploadedUrl && (
        <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center gap-2">
          <span className="text-green-700 text-sm">Путь к изображению:</span>
          <input
            type="text"
            value={uploadedUrl}
            readOnly
            className="flex-1 bg-transparent border-none text-green-800 font-mono text-xs"
            onFocus={e => e.target.select()}
          />
          <button
            type="button"
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              navigator.clipboard.writeText(uploadedUrl);
            }}
          >
            Копировать
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
