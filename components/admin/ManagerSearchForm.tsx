'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, updateUserRoles } from '@/lib/actions/admin-managers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type FoundUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isActive: boolean;
};

export function ManagerSearchForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Состояние чекбоксов
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFoundUser(null);
    setLoading(true);

    try {
      const user = await findUserByEmail(email);
      
      if (!user) {
        setError('Пользователь с таким email не найден');
        return;
      }

      setFoundUser(user);
      setIsAdmin(user.isAdmin);
      setIsManager(user.isManager);
      setIsSupervisor(user.isSupervisor);
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!foundUser) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUserRoles(foundUser.id, {
        isAdmin,
        isManager,
        isSupervisor,
      });
      
      setSuccess('Права успешно обновлены');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении прав');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Поиск и управление правами</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email пользователя
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            disabled={loading || saving}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || saving}
        >
          {loading ? 'Поиск...' : 'Найти'}
        </Button>
      </form>

      {/* Карточка пользователя с чекбоксами */}
      {foundUser && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{foundUser.name}</h3>
            <p className="text-sm text-gray-500">{foundUser.email}</p>
            {!foundUser.isActive && (
              <span className="text-xs text-orange-600">Email не подтверждён</span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
              <span className="text-sm font-medium text-gray-700">Администратор</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isManager}
                onChange={(e) => setIsManager(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={saving}
              />
              <span className="text-sm font-medium text-gray-700">Модератор</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSupervisor}
                onChange={(e) => setIsSupervisor(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={saving}
              />
              <span className="text-sm font-medium text-gray-700">Супервизор</span>
            </label>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      )}
    </div>
  );
}