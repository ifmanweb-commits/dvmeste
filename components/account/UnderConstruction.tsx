'use client'

export default function UnderConstruction() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-semibold text-gray-700">Раздел в разработке</h1>
      <p className="mt-2 text-gray-500 text-center max-w-md">
        Этот раздел временно недоступен. Мы работаем над его запуском.
      </p>
    </div>
  )
}