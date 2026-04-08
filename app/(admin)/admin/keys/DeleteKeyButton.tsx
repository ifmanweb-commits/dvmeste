'use client';

import { deleteKey } from './actions';

export default function DeleteKeyButton({ keyId }: { keyId: string }) {
  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот ключ? Доступы, выданные этим ключом, останутся.')) {
      return;
    }
    await deleteKey(keyId);
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-800"
    >
      Удалить
    </button>
  );
}