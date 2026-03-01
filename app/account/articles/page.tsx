export default function ArticlesPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Мои статьи</h2>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Темы для статей в этом месяце</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Как выбрать психолога под свой запрос</li>
          <li>КПТ vs Гештальт: что выбрать?</li>
          <li>Тревога и способы самопомощи</li>
          <li>Как понять, что вам нужен психолог</li>
        </ul>
      </div>

      <div className="border rounded-lg p-4">
        <p className="text-gray-600 mb-3">
          Чтобы оставаться в каталоге, сдавайте по одной статье в месяц.
        </p>
        <button className="bg-[#5858E2] text-white px-4 py-2 rounded-lg hover:bg-[#4747b5]">
          Отправить статью на проверку
        </button>
      </div>
    </div>
  )
}