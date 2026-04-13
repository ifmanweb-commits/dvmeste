import Script from 'next/script';
import { getBlocksBySlugs, getHeadBlocksBySlugs } from '@/lib/actions/admin-blocks';

interface Block {
  id: string;
  slug: string;
  name: string;
  content: string | null;
  description: string | null;
  isActive: boolean;
  isScript: boolean;
  inHead: boolean;
  order: number;
}

interface BlockRendererProps {
  /** Slug'и блоков для загрузки из БД */
  slugs?: string[];
  /** 'head' или 'body' - фильтрует блоки по inHead */
  variant?: 'head' | 'body';
  /** Опционально можно передать готовые блоки (если уже загружены) */
  blocks?: Block[];
}

/**
 * Рендерит блоки в зависимости от их типа
 * Может загружать блоки по slug'ам или принимать готовые блоки
 * 
 * @example
 * // Загрузка по slug'ам
 * <BlockRenderer slugs={['yandex-metrika', 'google-analytics']} variant="head" />
 * 
 * @example
 * // Передача готовых блоков
 * const blocks = await getBlocksBySlugs(['footer-contacts']);
 * <BlockRenderer blocks={blocks} variant="body" />
 */
export default async function BlockRenderer({ slugs, variant = 'body', blocks }: BlockRendererProps) {
  // Загружаем блоки по slug'ам, если не переданы готовые блоки
  const data = blocks ?? (slugs && slugs.length > 0 
    ? await getBlocksBySlugs(slugs)
    : []);

  // Фильтруем блоки по variant
  const filteredBlocks = data
    .filter((block) => block.isActive)
    .filter((block) => (variant === 'head' ? block.inHead : !block.inHead))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (filteredBlocks.length === 0) {
    return null;
  }

  return (
    <>
      {filteredBlocks.map((block) => {
        // Обработка скриптов
        if (block.isScript) {
          const content = block.content || '';
          
          // Внешний URL
          if (content.trim().startsWith('http')) {
            return (
              <Script
                key={block.id}
                src={content}
                strategy="afterInteractive"
              />
            );
          }
          
          // Извлекаем все <script> теги из контента (для Яндекс.Метрики и подобных)
          const scriptRegex = /<script(?:\s[^>]*)?>\s*([\s\S]*?)\s*<\/script>/gi;
          const scripts: string[] = [];
          let match;
          while ((match = scriptRegex.exec(content)) !== null) {
            if (match[1]) {
              scripts.push(match[1].trim());
            }
          }
          
          // Если есть скрипты — рендерим их (возвращаем массив без обёртки)
          if (scripts.length > 0) {
            return scripts.map((scriptCode, index) => (
              <Script
                key={`${block.id}-script-${index}`}
                id={`${block.id}-script-${index}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: scriptCode }}
              />
            ));
          }
          
          // Если нет тегов <script>, считаем что это чистый JS
          return (
            <Script
              key={block.id}
              id={`script-${block.id}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          );
        }

        // Обычные HTML-блоки
        return (
          <div
            key={block.id}
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      })}
    </>
  );
}