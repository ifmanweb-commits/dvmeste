"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
        <p className="text-gray-600 mb-6">У вас недостаточно прав</p>
        <div className="space-y-3">
          <Link
            href="/admin"
            className="block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            На главную админки
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("manager-auth");
              window.location.href = "/admin/login";
            }}
            className="block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Выйти и войти с другими правами
          </button>
        </div>
      </div>
    </div>
  );
}