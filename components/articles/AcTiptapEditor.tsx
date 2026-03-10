"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Minus  } from "lucide-react";

interface AcTiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onReady: (editor: any) => void;
  readOnly?: boolean;
}

export default function AcTiptapEditor({ content, onChange, onReady, readOnly = false }: AcTiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {  },
        listItem: {
          
        },
      }),
      Markdown.configure({
        html: false, // не преобразовывать HTML в Markdown
        tightLists: true, // компактные списки
      }),
      Image,
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // console.log('Editor storage:', editor.storage);
      // Передаем наверх именно Markdown строку
      // Безопасное получение markdown
      try {
        // @ts-expect-error - markdown storage существует в рантайме
        const markdown = editor.storage.markdown?.getMarkdown?.() || '';
        onChange(markdown);
      } catch (e) {
        console.error('Failed to get markdown:', e);
        onChange('');
      }
    },
    editorProps: {
      attributes: {
        // Добавляем класс prose для стандартных стилей текста (отступы, шрифты)
        class: 'tiptap-editor prose prose-slate max-w-none focus:outline-none min-h-[400px] px-4 py-6 border-none',
      },
    },
  });


  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Тулбар скрываем, если режим "только чтение" */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            active={editor.isActive('bold')}
            icon={<Bold size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            active={editor.isActive('italic')}
            icon={<Italic size={16} />} 
          />
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            active={editor.isActive('heading', { level: 1 })}
            icon={<Heading1 size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            active={editor.isActive('heading', { level: 2 })}
            icon={<Heading2 size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
            active={editor.isActive('heading', { level: 3 })}
            icon={<Heading3 size={16} />} 
          />
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            active={editor.isActive('bulletList')}
            icon={<List size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            active={editor.isActive('orderedList')}
            icon={<ListOrdered size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            active={editor.isActive('blockquote')}
            icon={<Quote size={16} />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().setHorizontalRule().run()} 
            icon={<Minus size={16} />}
          />
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ onClick, active, icon }: { onClick: () => void, active?: boolean, icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${
        active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
      }`}
    >
      {icon}
    </button>
  );
}