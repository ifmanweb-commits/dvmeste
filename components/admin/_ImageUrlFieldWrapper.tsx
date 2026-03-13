                                            
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

                                 
const ImageUrlsField = dynamic(
  () => import("@/components/admin/ImageUrlsField").then(mod => mod.ImageUrlsField),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <textarea
          name="images"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Загрузка компонента..."
          readOnly
        />
      </div>
    )
  }
);

type Props = {
  name?: string;
  defaultValue?: string;
  maxUrls?: number;
};

export function ImageUrlFieldWrapper({ 
  name = "images", 
  defaultValue = "", 
  maxUrls = 5 
}: Props) {
                                       
  return (
    <ImageUrlsField 
      name={name} 
      defaultValue={defaultValue} 
      maxUrls={maxUrls} 
    />
  );
}

                             
export  default function SimpleImageFieldWrapper({ 
  name = "images", 
  defaultValue = "", 
  maxUrls = 5 
}: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="space-y-2">
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Введите URL изображений, каждый с новой строки"
        />
        <p className="text-xs text-gray-500">
          Для загрузки файлов откройте страницу в браузере
        </p>
      </div>
    );
  }

                                
  const ClientImageUrlsField = dynamic(
    () => import("@/components/admin/ImageUrlsField").then(mod => mod.ImageUrlsField),
    { ssr: false }
  );

  return (
    <ClientImageUrlsField 
      name={name} 
      defaultValue={defaultValue} 
      maxUrls={maxUrls} 
    />
  );
}