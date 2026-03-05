'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, assignRole } from '@/lib/actions/admin-managers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AddManagerForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'ADMIN'>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Сначала ищем пользователя
      const user = await findUserByEmail(email);
      
      if (!user) {
        setError('Пользователь с таким email не найден');
        return;
      }

      if (!user.isActive) {
        setError('Email пользователя не подтверждён');
        return;
      }

      if (user.isAdmin || user.isManager) {
        setError('Пользователь уже имеет роль администратора или менеджера');
        return;
      }

      // Назначаем роль
      await assignRole(user.id, role);
      
      setSuccess(`Роль "${role === 'ADMIN' ? 'Администратор' : 'Менеджер'}" успешно назначена`);
      setEmail('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка при назначении роли');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Назначить менеджера или администратора</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Роль
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'MANAGER' | 'ADMIN')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            disabled={loading}
          >
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Администратор</option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Назначение...' : 'Назначить роль'}
        </Button>
      </form>
    </div>
  );
}