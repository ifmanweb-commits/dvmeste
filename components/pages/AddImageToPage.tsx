"use client";

import { useState } from "react";
import EntityFilesField from "@/components/files/EntityFilesField";

interface Props {
  initialImages?: string[];
  entityKey?: string;
}

export default function AddImageToPage({ initialImages = [], entityKey }: Props) {
  const [draftEntityKey] = useState(() => `page-draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const effectiveKey = entityKey?.trim() || draftEntityKey;

  return (
    <div className="my-4">
      <EntityFilesField
        scope="pages"
        entityKey={effectiveKey}
        initialUrls={initialImages}
        inputName="images"
        title="Файлы страницы"
        hint="Файлы сохраняются в /pages/files/[ключ-страницы]/. Можно загружать изображения и документы."
      />
    </div>
  );
}
