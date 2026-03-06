'use client';

import { useRef } from 'react';

type Props = {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
};

export default function FileUploader({ onUpload, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await onUpload(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer text-sm text-gray-600 hover:text-[#5858E2]"
      >
        {uploading ? 'Загрузка...' : 'Нажмите для выбора файлов'}
      </label>
    </div>
  );
}