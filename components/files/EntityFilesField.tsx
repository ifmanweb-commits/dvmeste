"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FileScope = "articles" | "pages";

type ManagedFile = {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
  legacy?: boolean;
};

type Props = {
  scope: FileScope;
  entityKey: string;
  title: string;
  hint?: string;
  inputName?: string;
  initialUrls?: string[];
  onInsertLink?: (file: ManagedFile) => void;
  onInsertImage?: (file: ManagedFile) => void;
};

const CLIENT_MAX_FILE_SIZE = 50 * 1024 * 1024;        
const MAX_PARALLEL_UPLOADS = 3;

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

function extractFileName(url: string): string {
  try {
    const parsed = new URL(url, "https://placeholder.local");
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) || "file");
  } catch {
    const parts = url.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) || "file");
  }
}

function mergeUniqueFiles(primary: ManagedFile[], legacyUrls: string[]): ManagedFile[] {
  const byUrl = new Map<string, ManagedFile>();
  primary.forEach((file) => byUrl.set(file.url, file));

  legacyUrls.forEach((url) => {
    if (!url || byUrl.has(url)) return;
    byUrl.set(url, {
      name: extractFileName(url),
      url,
      size: 0,
      updatedAt: "",
      legacy: true,
    });
  });

  return Array.from(byUrl.values());
}

function getAbsoluteUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

function isImageFileName(value: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg|heic|heif)(\?.*)?$/i.test(value || "");
}

export default function EntityFilesField({
  scope,
  entityKey,
  title,
  hint,
  inputName,
  initialUrls = [],
  onInsertLink,
  onInsertImage,
}: Props) {
  const [files, setFiles] = useState<ManagedFile[]>(() => mergeUniqueFiles([], initialUrls.filter(Boolean)));
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
    failed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [renameTargetUrl, setRenameTargetUrl] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const isMountedRef = useRef(true);

  const legacyUrls = useMemo(() => initialUrls.filter(Boolean), [initialUrls]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const listEndpoint = useMemo(
    () => `/api/files?scope=${encodeURIComponent(scope)}&entityKey=${encodeURIComponent(entityKey)}`,
    [scope, entityKey]
  );

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(listEndpoint, { cache: "no-store" });
      const data = (await response.json()) as { success?: boolean; files?: ManagedFile[]; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Не удалось загрузить файлы");
      }

      const merged = mergeUniqueFiles(data.files || [], legacyUrls);
      if (isMountedRef.current) {
        setFiles(merged);
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить файлы");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [legacyUrls, listEndpoint]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const uploadFiles = useCallback(
    async (selected: File[]) => {
      if (!selected.length) return;
      setUploading(true);
      setError(null);
      setNotice(null);

      try {
        const oversized = selected.filter((file) => file.size > CLIENT_MAX_FILE_SIZE);
        const queue = selected.filter((file) => file.size <= CLIENT_MAX_FILE_SIZE);

        const oversizedMessage =
          oversized.length > 0
            ? `Слишком большие файлы (макс. 50MB): ${oversized
                .slice(0, 3)
                .map((file) => file.name)
                .join(", ")}${oversized.length > 3 ? ` и ещё ${oversized.length - 3}` : ""}.`
            : "";

        if (!queue.length) {
          setError(oversizedMessage || "Нет файлов для загрузки.");
          return;
        }

        setUploadProgress({ total: queue.length, done: 0, failed: 0 });

        const failedFiles: string[] = [];
        let pointer = 0;

        const uploadOne = async (file: File): Promise<void> => {
          const formData = new FormData();
          formData.append("scope", scope);
          formData.append("entityKey", entityKey);
          formData.append("file", file);

          const response = await fetch("/api/files", {
            method: "POST",
            body: formData,
          });

          const data = (await response.json()) as {
            success?: boolean;
            error?: string;
            file?: ManagedFile;
          };

          if (!response.ok || !data.success || !data.file) {
            throw new Error(data.error || `Не удалось загрузить файл: ${file.name}`);
          }

          const uploadedFile: ManagedFile = data.file;
          setFiles((prev) => {
            if (prev.some((item) => item.url === uploadedFile.url)) return prev;
            return [uploadedFile, ...prev];
          });
        };

        const worker = async () => {
          while (pointer < queue.length) {
            const index = pointer;
            pointer += 1;
            const file = queue[index];
            if (!file) continue;

            try {
              await uploadOne(file);
            } catch {
              failedFiles.push(file.name);
              setUploadProgress((prev) => (prev ? { ...prev, failed: prev.failed + 1 } : prev));
            } finally {
              setUploadProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
            }
          }
        };

        const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, queue.length) }, () => worker());
        await Promise.all(workers);

        if (failedFiles.length > 0) {
          const failedMessage = `Не удалось загрузить: ${failedFiles
            .slice(0, 3)
            .join(", ")}${failedFiles.length > 3 ? ` и ещё ${failedFiles.length - 3}` : ""}.`;
          setError(oversizedMessage ? `${oversizedMessage} ${failedMessage}` : failedMessage);
        } else if (oversizedMessage) {
          setError(oversizedMessage);
          setNotice(`Загружено файлов: ${queue.length}.`);
        } else {
          setNotice(`Загружено файлов: ${queue.length}.`);
        }

        void loadFiles();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки файла");
      } finally {
        if (isMountedRef.current) {
          setUploading(false);
          setUploadProgress(null);
        }
      }
    },
    [scope, entityKey, loadFiles]
  );

  const onInputFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    void uploadFiles(selected);
    event.target.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setDragActive(false);

    const selected = Array.from(event.dataTransfer.files || []);
    void uploadFiles(selected);
  };

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      setDragActive(false);
      dragDepthRef.current = 0;
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const deleteFile = async (file: ManagedFile) => {
    setError(null);
    setNotice(null);

    const params = new URLSearchParams();
    if (file.legacy) {
      params.set("url", file.url);
    } else {
      params.set("scope", scope);
      params.set("entityKey", entityKey);
      params.set("name", file.name);
    }

    try {
      const response = await fetch(`/api/files?${params.toString()}`, { method: "DELETE" });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Не удалось удалить файл");
      }

      setFiles((prev) => prev.filter((item) => item.url !== file.url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить файл");
    }
  };

  const startRename = (file: ManagedFile) => {
    if (file.legacy) return;
    setRenameTargetUrl(file.url);
    setRenameValue(file.name);
    setError(null);
    setNotice(null);
  };

  const cancelRename = () => {
    setRenameTargetUrl(null);
    setRenameValue("");
  };

  const saveRename = async (file: ManagedFile) => {
    if (file.legacy) return;

    const newName = renameValue.trim();
    if (!newName) {
      setError("Введите новое имя файла");
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          entityKey,
          name: file.name,
          newName,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        file?: ManagedFile;
      };

      if (!response.ok || !data.success || !data.file) {
        throw new Error(data.error || "Не удалось переименовать файл");
      }

      const updatedFile: ManagedFile = data.file;
      setFiles((prev) =>
        prev.map((item) => (item.url === file.url ? { ...updatedFile, legacy: false } : item))
      );
      setRenameTargetUrl(null);
      setRenameValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось переименовать файл");
    }
  };

  const copyPath = async (url: string) => {
    try {
      await navigator.clipboard.writeText(getAbsoluteUrl(url));
      setNotice("Адрес скопирован");
      window.setTimeout(() => setNotice(null), 1500);
    } catch {
      setError("Не удалось скопировать адрес");
    }
  };

  const hasFiles = files.length > 0;
  const canInsertToContent = Boolean(onInsertLink || onInsertImage);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">{title}</label>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>

      <div
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        className={`rounded-xl border-2 border-dashed p-4 transition ${
          dragActive ? "border-[#5858E2] bg-[#5858E2]/5" : "border-gray-300 bg-gray-50"
        }`}
      >
        <p className="text-sm text-gray-700">
          Перетащите файлы сюда или{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-[#5858E2] underline underline-offset-2"
          >
            выберите с устройства
          </button>
          .
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputFiles}
        />
      </div>

      {uploading && uploadProgress && (
        <p className="text-xs text-gray-500">
          Загрузка файлов: {uploadProgress.done}/{uploadProgress.total}
          {uploadProgress.failed > 0 ? `, ошибок: ${uploadProgress.failed}` : ""}.
        </p>
      )}
      {uploading && !uploadProgress && <p className="text-xs text-gray-500">Загрузка файлов...</p>}
      {loading && <p className="text-xs text-gray-500">Загружаем список файлов...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {notice && <p className="text-xs text-green-600">{notice}</p>}

      {hasFiles && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
          {files.map((file) => {
            const isRenaming = renameTargetUrl === file.url;
            const isImage = isImageFileName(file.name) || isImageFileName(file.url);

            return (
              <div key={file.url} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>

                <input
                  type="text"
                  value={file.url}
                  readOnly
                  onFocus={(event) => event.target.select()}
                  className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700"
                />

                {isRenaming && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Новое имя файла"
                    />
                    <button
                      type="button"
                      onClick={() => void saveRename(file)}
                      className="rounded-md bg-[#5858E2] px-2 py-1 text-xs font-medium text-white hover:bg-[#4848d0]"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {canInsertToContent && (onInsertImage || onInsertLink) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isImage && onInsertImage) {
                          onInsertImage(file);
                          return;
                        }
                        if (onInsertLink) {
                          onInsertLink(file);
                          return;
                        }
                        onInsertImage?.(file);
                      }}
                      className="rounded-md border border-[#5858E2]/30 px-2 py-1 text-xs font-medium text-[#5858E2] hover:bg-[#5858E2]/5"
                    >
                      Вставить в статью
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void copyPath(file.url)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Скопировать адрес
                  </button>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Посмотреть
                  </a>

                  {!file.legacy && !isRenaming && (
                    <button
                      type="button"
                      onClick={() => startRename(file)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Переименовать
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void deleteFile(file)}
                    className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Удалить файл
                  </button>
                </div>

                {inputName && <input type="hidden" name={inputName} value={file.url} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
