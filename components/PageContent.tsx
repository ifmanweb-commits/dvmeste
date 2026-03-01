import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";

   
                                                                     
                                                                 
   
type Props = {
  title: string;
  template: string;
  content: string;
};

function extractRenderableContent(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return "";

  const headMatch = value.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch?.[1] || "";
  const headStyles = [
    ...(headContent.match(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*>/gi) || []),
    ...(headContent.match(/<style[\s\S]*?<\/style>/gi) || []),
  ].join("\n");

  const bodyMatch = value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let renderable = "";

  if (bodyMatch && bodyMatch[1]) {
    renderable = bodyMatch[1].trim();
  } else {
    const htmlMatch = value.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    if (htmlMatch && htmlMatch[1]) {
      renderable = htmlMatch[1].trim();
    } else {
      renderable = value;
    }
  }

  const preservedHeadStyles = headStyles.trim();
  if (!preservedHeadStyles) return renderable;

  return `${preservedHeadStyles}\n${renderable}`.trim();
}

export function PageContent({ title, template, content }: Props) {
  const safeContent = normalizeEmbeddedLocalAssetUrls(extractRenderableContent(content));

  if (template === "empty") {
    return (
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
        {title}
      </h1>
      <div
        className="mt-8 prose prose-neutral max-w-none text-foreground [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />
    </div>
  );
}
