"use client";

import { useState } from "react";
import { ClientBanModal } from "./ClientBanModal";

type ClientBanButtonProps = {
  clientId: string;
  isBanned: boolean;
};

export function ClientBanButton({ clientId, isBanned }: ClientBanButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`mt-4 px-4 py-2 text-sm font-medium rounded-lg transition ${
          isBanned
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {isBanned ? "Разбанить клиента" : "Забанить клиента"}
      </button>

      {isModalOpen && (
        <ClientBanModal
          clientId={clientId}
          isBanned={isBanned}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}