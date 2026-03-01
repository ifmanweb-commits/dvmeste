import { LayoutShell } from "@/components/layout/LayoutShell";

interface PageRendererProps {
  page: {
    id: string;
    template: string;
    content: string;
    customHead?: string | null;
    showHeader?: boolean;
    showFooter?: boolean;
    adminTitle?: string;
  };
}

export default function PageRenderer({ page }: PageRendererProps) {
  const { template, content, customHead, showHeader, showFooter, adminTitle } = page;

        // Для шаблона "blank" — полностью своя страница
        if (template === 'blank') {
        return (
            <html lang="ru">
            <head>
                {customHead && (
                <head dangerouslySetInnerHTML={{ __html: customHead }} />
                )}
            </head>
            <body dangerouslySetInnerHTML={{ __html: content }} />
            </html>
        );
        }

    // Для всех остальных шаблонов (landing, text) — внутри layout сайта
    return (
    <>
        {customHead && (
        <div dangerouslySetInnerHTML={{ __html: customHead }} style={{ display: 'none' }} />
        )}
        
        {template === 'landing' ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
            <article className="container mx-auto px-4 py-8 max-w-4xl prose prose-lg">
            <h1 className="text-3xl font-bold mb-6">{adminTitle}</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
            </article>
        )}
        
    </>
    );
}