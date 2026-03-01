"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ 
        redirect: true,
        callbackUrl: "/auth/login" 
      })}
      className="text-sm text-gray-600 hover:text-[#5858E2] transition-colors"
    >
      Выйти
    </button>
  );
}