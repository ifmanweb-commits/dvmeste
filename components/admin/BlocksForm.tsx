'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBlocks } from '@/lib/actions/admin-blocks';

interface Block {
  id: string;
  slug: string;
  name: string;
  content: string | null;
  description: string | null;
  isActive: boolean;
}

interface BlocksFormProps {
  blocks: Block[];
}

export default function BlocksForm({ blocks }: BlocksFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(
    blocks.map(block => ({
      id: block.id,
      content: block.content || '',
      isActive: block.isActive
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleContentChange = (blockId: string, value: string) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === blockId ? { ...item, content: value } : item
      )
    );
  };

  const handleActiveChange = (blockId: string, checked: boolean) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === blockId ? { ...item, isActive: checked } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateBlocks(formData);
      setSuccess('Блоки сохранены');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {blocks.map((block) => {
          const blockData = formData.find(b => b.id === block.id)!;
          
          return (
            <div key={block.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{block.name}</h3>
                  {block.description && (
                    <p className="text-sm text-gray-500 mt-1">{block.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">slug: {block.slug}</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={blockData.isActive}
                    onChange={(e) => handleActiveChange(block.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                  />
                  <span className="text-sm text-gray-700">Активен</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Содержимое
                </label>
                <textarea
                  value={blockData.content}
                  onChange={(e) => handleContentChange(block.id, e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  placeholder={`HTML-код для блока ${block.slug}`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Можно вставлять HTML, JavaScript, CSS. Будет вставлено как есть.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#5858E2] text-white rounded-lg hover:bg-[#4848d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Сохранение...' : 'Сохранить все блоки'}
        </button>
      </div>
    </form>
  );
}