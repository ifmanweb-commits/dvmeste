'use client';

import { FileItem } from './types';

type Props = {
  files: FileItem[];
  onDelete: (file: FileItem) => Promise<void>;
  onInsertLink?: (file: FileItem) => void;
  onInsertImage?: (file: FileItem) => void;
};

export default function FileList({ files, onDelete, onInsertLink, onInsertImage }: Props) {
  if (files.length === 0) return null;

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={file.url} className="border rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500 truncate">{file.url}</p>
            </div>
            <div className="flex gap-2 ml-4">
              {onInsertLink && (
                <button
                  type="button"
                  onClick={() => onInsertLink(file)}
                  className="text-xs text-[#5858E2] hover:underline"
                >
                  Ссылка
                </button>
              )}
              {onInsertImage && isImage(file.url) && (
                <button
                  type="button"
                  onClick={() => onInsertImage(file)}
                  className="text-xs text-[#5858E2] hover:underline"
                >
                  Изо
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(file)}
                className="text-xs text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}