"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  name?: string;
  defaultValue?: string;
  maxUrls?: number;
};

export function ImageUrlsField({ name = "imageUrls", defaultValue = "", maxUrls = 5 }: Props) {
  const initialUrls = defaultValue 
    ? defaultValue.split("\n").filter(url => url.trim() !== "")
    : [];
  
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [newUrl, setNewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

                 
  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || urls.length >= maxUrls) return;
    
                               
    const isValid = /^(https?:\/\/|\/)/.test(trimmed) || 
                   /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed);
    
    if (!isValid) {
      alert("Пожалуйста, введите корректный URL изображения");
      return;
    }
    
    setUrls(prev => [...prev, trimmed]);
    setNewUrl("");
  };

                    
  const removeItem = (index: number) => {
    setUrls(prev => {
      const newUrls = [...prev];
                                                                   
      if (newUrls[index]?.startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      return newUrls.filter((_, i) => i !== index);
    });
    
                                                       
    const fileIndex = index - initialUrls.length;
    if (fileIndex >= 0 && fileIndex < files.length) {
      setFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };

                            
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const totalItems = urls.length + selectedFiles.length;
    
    if (totalItems > maxUrls) {
      alert(`Можно загрузить максимум ${maxUrls} файлов`);
      return;
    }
    
                      
    setFiles(prev => [...prev, ...selectedFiles]);
    
                                              
    const tempUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setUrls(prev => [...prev, ...tempUrls]);
    
                       
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

                                              
  useEffect(() => {
    return () => {
      urls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

                                        
  const externalUrls = urls.filter(url => !url.startsWith('blob:'));
  const fileUrls = urls.filter(url => url.startsWith('blob:'));

  return (
    <div className="space-y-4">
      {                               }
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Загрузить файлы
        </label>
        <input
          ref={fileInputRef}
          type="file"
          name="images"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-[#5858E2] file:px-4 file:py-2 file:text-white hover:file:bg-[#4848d0]"
        />
        <p className="mt-1 text-xs text-neutral-dark">
          Можно выбрать несколько файлов. Максимум {maxUrls} файлов.
        </p>
      </div>

      {                                }
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Или добавить по URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            placeholder="https://example.com/photo.jpg или /uploads/filename.jpg"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-foreground"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!newUrl.trim() || urls.length >= maxUrls}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </div>

      {                                  }
      {(urls.length > 0) && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Выбранные изображения ({urls.length}/{maxUrls}):
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {urls.map((url, index) => {
              const isFile = url.startsWith('blob:');
              const fileIndex = index - initialUrls.length;
              const fileName = isFile && fileIndex >= 0 && files[fileIndex] 
                ? files[fileIndex].name 
                : null;
              
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    {                        }
                    <div className="h-10 w-10 rounded border border-neutral-300 overflow-hidden bg-white">
                      <img 
                        src={url} 
                        alt={`Изображение ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="Arial" font-size="8" fill="%239ca3af" text-anchor="middle" dy=".3em">IMG</text></svg>';
                        }}
                      />
                    </div>
                    
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" title={url}>
                        {fileName || url.split('/').pop() || `Изображение ${index + 1}`}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {isFile ? 'Локальный файл' : 'Внешняя ссылка'}
                        {index === 0 && ' • Основное'}
                        {index < initialUrls.length && ' • Из БД'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Удалить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {                                                                           }
      {initialUrls.length > 0 && (
        <input 
          type="hidden" 
          name="existingImages" 
          value={initialUrls.join("\n")} 
        />
      )}

      {                                      }
      <input 
        type="hidden" 
        name={name} 
        value={externalUrls.join("\n")} 
      />

      {                }
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Важно:</span> Файлы будут загружены на сервер. 
          Первое изображение в списке будет основным.
        </p>
      </div>
    </div>
  );
}