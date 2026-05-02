'use client';

import Link from "next/link";
import { Copy, Check, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import DeleteKeyButton from "./DeleteKeyButton";
import SecretsTabs from "../secrets/components/SecretsTabs";
import { deleteExpiredKeys } from "./actions";

interface Key {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface KeysTableProps {
  keys: Key[];
}

function KeysTable({ keys }: KeysTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Код ключа
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Использовано
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Истекает
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {keys.map((key) => (
            <tr key={key.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900">{key.code}</code>
                  <button
                    onClick={() => handleCopy(key.code, key.id)}
                    className="flex items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Копировать ключ"
                  >
                    {copiedId === key.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-600">
                  {key.usedCount} / {key.maxUses === 0 ? '∞' : key.maxUses}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {key.expiresAt ? (
                  <span className={`text-sm ${new Date(key.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                    {new Date(key.expiresAt).toLocaleDateString('ru-RU')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  key.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {key.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link
                  href={`/admin/keys/${key.id}/edit`}
                  className="text-[#5858E2] hover:text-[#4a4ac9] mr-3"
                >
                  Редактировать
                </Link>
                <DeleteKeyButton keyId={key.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KeysPage() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await fetch('/api/admin/keys');
        const data = await response.json();
        setKeys(data.keys);
      } catch (error) {
        console.error('Error fetching keys:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const handleDeleteExpired = async () => {
    if (!confirm('Удалить все неактуальные ключи (с истёкшим сроком или исчерпанным лимитом)?')) return;
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      const result = await deleteExpiredKeys();
      setDeleteMessage(result.message);
      // Перезагружаем список ключей
      const response = await fetch('/api/admin/keys');
      const data = await response.json();
      setKeys(data.keys);
    } catch (error) {
      setDeleteMessage('Ошибка при удалении ключей');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ключи доступа</h1>
            <p className="text-gray-500 mt-1">Управление ключами доступа</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteExpired}
              disabled={isDeleting}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Удаление...' : 'Удалить неактуальные'}
            </button>
            <Link
              href="/admin/keys/new"
              className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              + Создать ключ
            </Link>
          </div>
        </div>

        {deleteMessage && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
            deleteMessage.includes('Нет') ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
          }`}>
            {deleteMessage}
          </div>
        )}

        {/* Вкладки */}
        <SecretsTabs />

        <div className="mt-6">
        {keys.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Ключи ещё не созданы</p>
            <Link
              href="/admin/keys/new"
              className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Создать первый ключ
            </Link>
          </div>
        ) : (
          <KeysTable keys={keys} />
        )}
        </div>
      </div>
    </div>
  );
}