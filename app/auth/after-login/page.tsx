"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AfterLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    //console.log('=== AFTER LOGIN CLIENT ===');
    //console.log('status:', status);
    //console.log('session:', session);

    if (status === "loading") return;

    if (!session?.user) {
      //console.log('❌ No session, redirect to login');
      router.push("/auth/login");
      return;
    }

    const isAdmin = session.user.isAdmin === true;
    const isManager = session.user.isManager === true;
    const isPsychologist = session.user.isPsychologist === true;

    //console.log('flags:', { isAdmin, isManager, isPsychologist });

    if (isAdmin || isManager) {
      //console.log('✅ Redirect to /admin');
      router.push("/admin");
    } else if (isPsychologist) {
      //console.log('✅ Redirect to /account');
      router.push("/account");
    } else {
      //console.log('✅ Redirect to /');
      router.push("/");
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Перенаправление...</h1>
        <p className="text-gray-600">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}