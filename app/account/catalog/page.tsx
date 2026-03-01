export default function CatalogRequestPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Заявка в каталог</h2>

      <div className="border rounded-lg p-4 mb-4">
        <p className="text-gray-600 mb-4">
          Чтобы попасть в каталог, нужно заполнить анкету. После проверки менеджером вы станете видны клиентам.
        </p>
        
        <button className="bg-[#5858E2] text-white px-4 py-2 rounded-lg">
          Заполнить анкету
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-yellow-50">
        <p className="text-sm text-gray-700">
          ⚠️ Анкета проверяется вручную. Обычно это занимает 2–3 дня.
        </p>
      </div>
    </div>
  )
}