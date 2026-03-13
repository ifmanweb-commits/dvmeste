'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission: string;                                                                 
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requiredPermission, 
  redirectTo = '/managers' 
}: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const didCheckRef = useRef(false);

  useEffect(() => {
    if (didCheckRef.current) return;
    didCheckRef.current = true;

    async function checkPermission() {
      try {
                                   
        const authResponse = await fetch('/api/auth/check');
        const authData = await authResponse.json();

        if (!authResponse.ok || !authData.user) {
          router.push('/auth/login');
          return;
        }

                                                           
        if (!['ADMIN', 'MANAGER'].includes(authData.user.role)) {
          router.push('/auth/login?error=Доступ+только+для+менеджеров');
          return;
        }

        const user = authData.user;

                                                     
        const [module, action] = requiredPermission.split('.');

                                                      
        if (module === 'managers' && user.role !== 'ADMIN') {
          router.push('/managers?error=Только+администратор+может+управлять+менеджерами');
          return;
        }

                                                          
        if (user.permissions?.[module]?.[action]) {
          setHasAccess(true);
        } else {
          router.push(`/managers?error=Нет+доступа+к+разделу`);
        }

      } catch (error) {
        console.error('Error checking permission:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [requiredPermission, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;                           
  }

  return <>{children}</>;
}
