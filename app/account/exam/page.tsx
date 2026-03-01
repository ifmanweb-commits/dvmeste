export default function ExamPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Экзамены и сертификация</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold">Уровень 1 — Базовый</h3>
          <p className="text-gray-600">Подтвердите знание основ и методов</p>
          <button className="mt-2 bg-[#5858E2] text-white px-4 py-2 rounded-lg">
            Записаться
          </button>
        </div>

        <div className="border rounded-lg p-4 opacity-50">
          <h3 className="font-semibold">Уровень 2 — Продвинутый</h3>
          <p className="text-gray-600">Доступно после сдачи уровня 1</p>
        </div>

        <div className="border rounded-lg p-4 opacity-50">
          <h3 className="font-semibold">Уровень 3 — Эксперт</h3>
          <p className="text-gray-600">Доступно после сдачи уровня 2</p>
        </div>
      </div>
    </div>
  )
}