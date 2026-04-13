'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBlocks, createBlock, deleteBlock, saveBlock, type BlockCreateData } from '@/lib/actions/admin-blocks';

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

interface BlocksFormProps {
  blocks: Block[];
}

type TabVariant = 'head' | 'body' | 'all';

export default function BlocksForm({ blocks }: BlocksFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabVariant>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState(
    blocks.map(block => ({
      id: block.id,
      content: block.content || '',
      isActive: block.isActive,
      isScript: block.isScript,
      inHead: block.inHead,
      order: block.order
    }))
  );
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Статусы сохранения для отдельных блоков
  const [blockSavingStatus, setBlockSavingStatus] = useState<Record<string, { saving: boolean; message: string; type: 'success' | 'error' | null }>>({});

  // Форма для создания нового блока
  const [newBlock, setNewBlock] = useState<BlockCreateData>({
    name: '',
    slug: '',
    description: '',
    content: '',
    isActive: true,
    isScript: false,
    inHead: false,
    order: 0
  });

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

  const handleIsScriptChange = (blockId: string, checked: boolean) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === blockId ? { ...item, isScript: checked } : item
      )
    );
  };

  const handleInHeadChange = (blockId: string, checked: boolean) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === blockId ? { ...item, inHead: checked } : item
      )
    );
  };

  const handleOrderChange = (blockId: string, value: number) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === blockId ? { ...item, order: value } : item
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

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await createBlock(newBlock);
      setSuccess('Блок создан');
      setShowCreateModal(false);
      setNewBlock({
        name: '',
        slug: '',
        description: '',
        content: '',
        isActive: true,
        isScript: false,
        inHead: false,
        order: 0
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании блока');
    }
  };

  const handleDeleteBlock = async (blockId: string, blockName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить блок "${blockName}"?`)) {
      return;
    }
    
    try {
      await deleteBlock(blockId);
      setSuccess('Блок удален');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении блока');
    }
  };

  const handleSaveBlock = async (blockId: string) => {
    const blockData = formData.find(b => b.id === blockId);
    if (!blockData) return;
    
    setBlockSavingStatus(prev => ({ ...prev, [blockId]: { saving: true, message: '', type: null } }));
    
    try {
      await saveBlock(blockData);
      setBlockSavingStatus(prev => ({ ...prev, [blockId]: { saving: false, message: 'Блок сохранён', type: 'success' } }));
      
      // Очистить сообщение через 3 секунды
      setTimeout(() => {
        setBlockSavingStatus(prev => ({ ...prev, [blockId]: { saving: false, message: '', type: null } }));
      }, 3000);
    } catch (err: any) {
      setBlockSavingStatus(prev => ({ ...prev, [blockId]: { saving: false, message: err.message || 'Ошибка при сохранении', type: 'error' } }));
      
      // Очистить сообщение через 3 секунды
      setTimeout(() => {
        setBlockSavingStatus(prev => ({ ...prev, [blockId]: { saving: false, message: '', type: null } }));
      }, 3000);
    }
  };

  // Фильтрация и сортировка блоков по вкладке и порядку
  const filteredBlocks = blocks
    .filter(block => {
      if (activeTab === 'all') return true;
      if (activeTab === 'head') return block.inHead;
      if (activeTab === 'body') return !block.inHead;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div>
      {/* Вкладки */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-[#5858E2] border-b-2 border-[#5858E2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Все блоки
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('head')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'head'
              ? 'text-[#5858E2] border-b-2 border-[#5858E2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Head ({blocks.filter(b => b.inHead).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'body'
              ? 'text-[#5858E2] border-b-2 border-[#5858E2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Body ({blocks.filter(b => !b.inHead).length})
        </button>
      </div>

      {/* Кнопка создания блока */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          + Создать новый блок
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {filteredBlocks.map((block) => {
            const blockData = formData.find(b => b.id === block.id)!;
            
            return (
              <div key={block.id} className="bg-white rounded-lg border border-gray-200 p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{block.name}</h3>
                    {block.description && (
                      <p className="text-sm text-gray-500 mt-1">{block.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">slug: {block.slug}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={blockData.isActive}
                        onChange={(e) => handleActiveChange(block.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                      />
                      <span className="text-sm text-gray-700">Активен</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id, block.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockData.isScript}
                      onChange={(e) => handleIsScriptChange(block.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                    />
                    <span className="text-sm text-gray-700">Это скрипт</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockData.inHead}
                      onChange={(e) => handleInHeadChange(block.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                    />
                    <span className="text-sm text-gray-700">Вставить в head</span>
                  </label>
                  
                  <div>
                    <label className="text-sm text-gray-700 mr-2">Порядок:</label>
                    <input
                      type="number"
                      value={blockData.order}
                      onChange={(e) => handleOrderChange(block.id, parseInt(e.target.value) || 0)}
                      className="w-20 rounded border-gray-300 text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                      min="0"
                      max="999"
                    />
                  </div>
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
                    placeholder={blockData.isScript 
                      ? `JavaScript код или URL внешнего скрипта для ${block.slug}`
                      : `HTML-код для блока ${block.slug}`
                    }
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {blockData.isScript 
                      ? 'Для внешних скриптов укажите полный URL (начинается с http). Для инлайн-скриптов — полный JS-код.'
                      : 'Можно вставлять HTML, JavaScript, CSS. Будет вставлено как есть.'
                    }
                  </p>
                </div>
                
                {/* Кнопка сохранения блока и уведомление */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  {blockSavingStatus[block.id] && blockSavingStatus[block.id].message && (
                    <span className={`text-sm ${
                      blockSavingStatus[block.id].type === 'success' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {blockSavingStatus[block.id].message}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveBlock(block.id)}
                    disabled={blockSavingStatus[block.id]?.saving}
                    className="px-4 py-2 bg-[#5858E2] text-white text-sm rounded-lg hover:bg-[#4848d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {blockSavingStatus[block.id]?.saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Нет блоков в этой категории. Создайте новый блок.
          </div>
        )}

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

      {/* Модальное окно создания блока */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Создать новый блок</h2>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название блока *
                </label>
                <input
                  type="text"
                  value={newBlock.name}
                  onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL-адрес) *
                </label>
                <input
                  type="text"
                  value={newBlock.slug}
                  onChange={(e) => setNewBlock({ ...newBlock, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                  placeholder="my-custom-block"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <input
                  type="text"
                  value={newBlock.description}
                  onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                  placeholder="Краткое описание блока"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newBlock.isScript}
                    onChange={(e) => setNewBlock({ ...newBlock, isScript: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                  />
                  <span className="text-sm text-gray-700">Это скрипт</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newBlock.inHead}
                    onChange={(e) => setNewBlock({ ...newBlock, inHead: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                  />
                  <span className="text-sm text-gray-700">В head</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Порядок вывода
                </label>
                <input
                  type="number"
                  value={newBlock.order}
                  onChange={(e) => setNewBlock({ ...newBlock, order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                  min="0"
                  max="999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Содержимое
                </label>
                <textarea
                  value={newBlock.content}
                  onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#5858E2] focus:ring-1 focus:ring-[#5858E2]"
                  placeholder={newBlock.isScript 
                    ? 'JavaScript код или URL внешнего скрипта'
                    : 'HTML-код'
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4848d0] transition-colors"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}