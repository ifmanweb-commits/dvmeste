"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
    >
      Выйти
    </button>
  );
}