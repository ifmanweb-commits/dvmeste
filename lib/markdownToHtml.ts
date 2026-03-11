import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

export function markdownToHtml(markdown: string): string {
  // Убедимся, что код выполняется на сервере
  if (typeof window !== 'undefined') {
    throw new Error('markdownToHtml should only be used on the server');
  }

  try {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Markdown,
      ],
      content: markdown,
      // Отключаем всё, что может требовать DOM
      editable: false,
      injectCSS: false,
    });
    
    const html = editor.getHTML();
    editor.destroy();
    
    return html;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // В случае ошибки возвращаем исходный Markdown
    return markdown;
  }
}