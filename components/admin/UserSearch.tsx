"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FoundUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  inCatalog: boolean;
};

export function UserSearch() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setFoundUser(null);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/find?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при поиске");
      } else if (!data.user) {
        setNotFound(true);
      } else {
        setFoundUser(data.user);
      }
    } catch (err) {
      setError("Ошибка при поиске");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async (role: 'ADMIN' | 'MANAGER') => {
    if (!foundUser) return;

    setIsAssigning(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${foundUser.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при назначении");
      } else {
        setFoundUser(null);
        setEmail("");
        router.refresh();
      }
    } catch (err) {
      setError("Ошибка при назначении");
    } finally {
      setIsAssigning(false);
    }
  };

  const isAlreadyInTeam = foundUser && (foundUser.role === 'ADMIN' || foundUser.role === 'MANAGER');

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Добавить в команду</h2>
      
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите email пользователя"
          className="flex-1 p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !email.trim()}
          className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4747b5] transition-colors disabled:opacity-50"
        >
          {isSearching ? "Поиск..." : "Найти"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {notFound && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
          Пользователь с таким email не найден
        </div>
      )}

      {foundUser && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{foundUser.name}</p>
              <p className="text-sm text-gray-600">{foundUser.email}</p>
              <div className="flex gap-2 mt-2">
                {!foundUser.isActive && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Email не подтверждён
                  </span>
                )}
                {foundUser.inCatalog && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Есть в каталоге
                  </span>
                )}
              </div>
            </div>

            {isAlreadyInTeam ? (
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                Уже в команде
              </span>
            ) : (
              <div className="flex gap-2">
                {foundUser.isActive && (
                  <>
                    <button
                      onClick={() => handleAssign('MANAGER')}
                      disabled={isAssigning}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Сделать менеджером
                    </button>
                    <button
                      onClick={() => handleAssign('ADMIN')}
                      disabled={isAssigning}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      Сделать админом
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}