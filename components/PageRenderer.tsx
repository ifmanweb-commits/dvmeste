import { LayoutShell } from "@/components/layout/LayoutShell";
import Script from "next/script";

interface PageRendererProps {
  page: {
    id: string;
    slug: string;
    template: string;
    content: string;
    customHead?: string | null;
    adminTitle?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
}

export default function PageRenderer({ page }: PageRendererProps) {
  const { template, content, customHead, slug, adminTitle } = page;
  
  // Уникальный класс для изоляции стилей
  const pageUniqueClass = `page-${slug}`;

  // Парсинг customHead для извлечения скриптов
  const parseCustomHead = () => {
    if (!customHead) return { scripts: [], styles: '' };
    
    const scripts: Array<{ src?: string; content: string }> = [];
    let styles = '';
    
    // Извлекаем скрипты
    const scriptRegex = /<script(?:\s+src="([^"]*)")?(?:\s+type="([^"]*)")?\s*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(customHead)) !== null) {
      scripts.push({
        src: match[1],
        content: match[3] || ''
      });
    }
    
    // Остальное — стили и прочее
    styles = customHead.replace(scriptRegex, '').trim();
    
    return { scripts, styles };
  };

  const { scripts, styles } = parseCustomHead();

  // Для шаблона "blank" — только контент, без обертки
  if (template === 'blank') {
    return (
      <>
        {styles && (
          <style dangerouslySetInnerHTML={{ __html: styles }} suppressHydrationWarning />
        )}
        {scripts.map((script, index) => (
          script.src ? (
            <Script key={index} src={script.src} />
          ) : (
            <Script key={index} id={`blank-script-${index}`}>
              {script.content}
            </Script>
          )
        ))}
        <div className={pageUniqueClass}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </>
    );
  }

  // Для лендинга — с оберткой LayoutShell и уникальным классом
  if (template === 'landing') {
    return (
      <>
        {styles && (
          <style dangerouslySetInnerHTML={{ __html: styles }} suppressHydrationWarning />
        )}
        {scripts.map((script, index) => (
          script.src ? (
            <Script key={index} src={script.src} />
          ) : (
            <Script key={index} id={`landing-script-${index}`}>
              {script.content}
            </Script>
          )
        ))}
        <LayoutShell>
          <main className={`flex-1 ${pageUniqueClass}`}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </main>
        </LayoutShell>
      </>
    );
  }

  // Для текстовой страницы — стандартное оформление
  return (
    <>
      {styles && (
        <style dangerouslySetInnerHTML={{ __html: styles }} suppressHydrationWarning />
      )}
      {scripts.map((script, index) => (
        script.src ? (
          <Script key={index} src={script.src} />
        ) : (
          <Script key={index} id={`text-script-${index}`}>
            {script.content}
          </Script>
        )
      ))}
      <LayoutShell>
        <article className={`container mx-auto px-4 py-8 max-w-4xl prose prose-lg ${pageUniqueClass}`}>
          <h1 className="text-3xl font-bold mb-6">{adminTitle}</h1>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </LayoutShell>
    </>
  );
}