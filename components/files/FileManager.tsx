'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, Eye, Trash2, Check } from 'lucide-react';

type FileItem = {
  name: string;
  url: string;
  size: number;
  id?: string; // для режима БД
};

type Props = {
  scope: 'pages' | 'articles';
  entityKey: string;
  title: string;
  hint?: string;
  onFilesChange?: (urls: string[]) => void;
  onSelect?: (url: string) => void;
  mode?: 'fs' | 'db'; // новый пропс: 'fs' - файловая система (старое), 'db' - через БД
};

export default function FileManager({
  scope,
  entityKey,
  title,
  hint,
  onFilesChange,
  onSelect,
  mode = 'fs', // по умолчанию старый режим для обратной совместимости
}: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  
  const prevUrlsRef = useRef<string[] | undefined>(undefined);

  // Определяем API URL в зависимости от режима
  const getApiUrl = (action: 'list' | 'upload' | 'delete', file?: FileItem) => {
    if (mode === 'db') {
      //console.log('Режим БД');
      // Для режима БД используем новый роут
      switch (action) {
        case 'list':
        case 'upload':
          return `/api/articles/${entityKey}/images-admin`;
        case 'delete':
          return `/api/articles/${entityKey}/images-admin?imageId=${file?.id}`;
      }
    } else {
      // Старый режим через /api/files
      const baseUrl = `/api/files?scope=${scope}&entityKey=${entityKey}`;
      switch (action) {
        case 'list':
          return baseUrl;
        case 'upload':
          return '/api/files';
        case 'delete':
          return `${baseUrl}&name=${encodeURIComponent(file?.name || '')}`;
      }
    }
  };

  // Загружаем файлы при монтировании
  useEffect(() => {
    let mounted = true;

    const loadFiles = async () => {
      try {
        const url = getApiUrl('list');
        const res = await fetch(url);
        const data = await res.json();
        
        if (mounted && data.success) {
          if (mode === 'db') {
            // Новая структура: data.files
            setFiles(data.files?.map((file: any) => ({
              id: file.id,
              name: file.name,
              url: file.url,
              size: file.size || 0
            })) || []);
          } else {
            // Старый режим
            setFiles(data.files || []);
          }
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFiles();

    return () => { mounted = false; };
  }, [scope, entityKey, mode]);

  // Сообщаем родителю об изменениях
  useEffect(() => {
    if (!loading && onFilesChange) {
      const urls = files.map(f => f.url);
      
      if (prevUrlsRef.current === undefined) {
        prevUrlsRef.current = urls;
        onFilesChange(urls);
      } else {
        const changed = 
          prevUrlsRef.current.length !== urls.length ||
          prevUrlsRef.current.some((url, i) => url !== urls[i]);
        
        if (changed) {
          prevUrlsRef.current = urls;
          onFilesChange(urls);
        }
      }
    }
  }, [files, loading, onFilesChange]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    
    if (mode === 'db') {
      // В режиме БД передаём только файл
      formData.append('file', file);
    } else {
      // Старый режим
      formData.append('scope', scope);
      formData.append('entityKey', entityKey);
      formData.append('file', file);
    }

    setUploading(true);
    try {
      const url = getApiUrl('upload');
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success) {
        if (mode === 'db' && data.file) {
          setFiles(prev => [...prev, {
            id: data.file.id,      // может быть null для не-изображений
            name: data.file.name,
            url: data.file.url,
            size: 0
          }]);
        } else if (data.file) {
          setFiles(prev => [...prev, data.file]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    const params = new URLSearchParams();
    
    if (file.id) {
      // Это изображение из БД
      params.append('imageId', file.id);
    } else {
      // Обычный файл
      params.append('filename', file.name);
    }
    
    const url = `/api/articles/${entityKey}/images-admin?${params}`;
    
    try {
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => prev.filter(f => f.url !== file.url));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFile(url);
      setTimeout(() => setCopiedFile(null), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Загрузка файлов...</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{title}</label>

      {/* Две колонки */}
      <div className="grid grid-cols-2 gap-3">
        {/* Левая колонка - загрузка */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-[#5858E2] transition-colors text-center flex flex-col items-center justify-center">
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-block px-3 py-1 bg-[#5858E2] text-white text-xs rounded-md hover:bg-[#4848d0] transition-colors mb-1"
          >
            Выберите файл
          </label>
          <p className="text-xs text-gray-400">
            {hint || "Выберите или перетащите файл в эту область для загрузки"}
          </p>
          {uploading && <p className="text-xs text-gray-500 mt-1">Загрузка...</p>}
        </div>

        {/* Правая колонка - список файлов */}
        <div className="bg-gray-50 rounded-lg p-0 max-h-[200px] overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-1">Нет файлов</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.url}
                  onClick={() => onSelect?.(file.url)}
                  className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-all group ${
                    onSelect ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-400' : ''
                  }`}
                >
                  {/* Имя файла */}
                  <span className="text-xs text-gray-700 truncate max-w-[110px]" title={file.name}>
                    {file.name}
                  </span>

                  {/* Действия */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(file.url);
                      }}
                      className="p-0.5 text-gray-400 hover:text-[#5858E2] transition-colors relative"
                      title="Копировать адрес"
                    >
                      {copiedFile === file.url ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Link size={12} />
                      )}
                    </button>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-0.5 text-gray-400 hover:text-[#5858E2] transition-colors"
                      title="Открыть"
                    >
                      <Eye size={12} />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}