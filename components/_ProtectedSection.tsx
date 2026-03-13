'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Permission } from '@/lib/permissions';

interface ProtectedSectionProps {
  children: React.ReactNode;
  requiredPermission: Permission;
  fallback?: React.ReactNode;
}

export default function ProtectedSection({ 
  children, 
  requiredPermission,
  fallback 
}: ProtectedSectionProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
                                                
      const res = await fetch('/api/admin/managers/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: requiredPermission }),
      });

      if (res.ok) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Ошибка проверки прав:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return fallback || (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">
          У вас нет прав доступа к этому разделу
        </p>
      </div>
    );
  }

  return <>{children}</>;
}