// components/articles/AcImageManager.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Copy, ExternalLink, Trash2, Check } from "lucide-react";
import { getArticleImages, uploadArticleImage, deleteArticleImage } from "@/lib/actions/article-images";

interface AcImageManagerProps {
  articleId: string;
  onFileSelect: (url: string) => void;
}

interface ImageItem {
  id: string;
  url: string;
  filename: string;
}

// Тип для ответа от getArticleImages
type GetImagesResult = {
  success: true;
  images: {
    id: string;
    url: string;
    storagePath: string;
    articleId: string;
    createdAt: Date;
  }[];
} | {
  success: false;
  error: string;
};

export default function AcImageManager({ articleId, onFileSelect }: AcImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка списка изображений
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await getArticleImages(articleId) as GetImagesResult;
      
      if (result.success) {
        setImages(result.images.map(img => ({
          id: img.id,
          url: img.url,
          filename: img.url.split('/').pop() || 'image'
        })));
      } else {
        setError(result.error || "Ошибка загрузки");
      }
      setIsLoading(false);
    };
    
    loadImages();
  }, [articleId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = '';
  };

  const handleFiles = async (files: File[]) => {
    setError(null);
    
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Можно загружать только изображения");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`Файл "${file.name}" больше 5 МБ`);
        return;
      }
    }

    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await uploadArticleImage(articleId, formData);
      
      if (result.success && result.image) {
        setImages(prev => [{
          id: result.image!.id,
          url: result.image!.url,
          filename: result.image!.filename
        }, ...prev]);
      } else {
        setError(result.error || "Ошибка загрузки");
      }
    }
    
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить изображение?")) return;
    
    const result = await deleteArticleImage(id);
    if (result.success) {
      setImages(prev => prev.filter(img => img.id !== id));
    } else {
      setError(result.error || "Ошибка удаления");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Загрузчик */}
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700">
          {uploading ? "Загрузка..." : "Выберите файл"}
        </p>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP, GIF • до 5 МБ</p>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Лента изображений */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 border border-slate-100 rounded-lg">
            <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">Нет изображений</p>
          </div>
        ) : (
          images.map((img) => (
            <div 
              key={img.id}
              className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
            >
              {/* Превью */}
              <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                <img 
                  src={img.url} 
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Имя файла */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {img.filename}
                </p>
              </div>

              {/* Иконки действий */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onFileSelect(img.url)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Вставить в статью"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => window.open(img.url, '_blank')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Открыть в новой вкладке"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}