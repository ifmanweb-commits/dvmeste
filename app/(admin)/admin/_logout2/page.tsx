"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
                              
    document.cookie = 'manager-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
                                 
    setTimeout(() => {
      router.push("/auth/login");
    }, 100);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#5858E2] border-t-transparent"></div>
        <p className="text-gray-600">Выход из системы...</p>
      </div>
    </div>
  );
}