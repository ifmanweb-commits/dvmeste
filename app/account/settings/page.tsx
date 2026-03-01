export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Настройки</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" value="psychologist@mail.ru" readOnly className="w-full p-2 border rounded-lg bg-gray-50" />
          <p className="text-sm text-gray-500 mt-1">Используется для входа</p>
        </div>

        <div>
          <label className="block mb-1">Новый пароль</label>
          <input type="password" placeholder="оставьте пустым, если не меняете" className="w-full p-2 border rounded-lg" />
        </div>

        <div className="pt-4">
          <button className="bg-[#5858E2] text-white px-4 py-2 rounded-lg">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}