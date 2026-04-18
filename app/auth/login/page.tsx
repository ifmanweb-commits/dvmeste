'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserType = 'client' | 'psychologist' | null

export default function LoginPage() {
  const [userType, setUserType] = useState<UserType>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    if (!consentGiven) {
      setError('Необходимо дать согласие на обработку персональных данных')
      setIsLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          userType: userType || 'psychologist',
          consentGiven: true
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Что-то пошло не так')
      }
      
      setIsSent(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка отправки')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleBack = () => {
    setUserType(null)
    setEmail('')
    setError('')
    setIsSent(false)
  }
  
  // Экран выбора типа пользователя
  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl p-6">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Выберите тип входа
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Область для клиентов - синий цвет (primary) */}
            <button
              onClick={() => setUserType('client')}
              className="group relative flex flex-col items-center justify-center p-8 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[280px]"
            >
              <div className="text-center">
                <div className="mb-4 text-6xl">👤</div>
                <h2 className="text-2xl font-bold mb-2">Для клиентов</h2>
                <p className="text-white/80 text-sm">
                  Вход для записи к психологу и управления консультациями
                </p>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-all duration-300" />
            </button>
            
            {/* Область для психологов - зелёный цвет (accent) */}
            <button
              onClick={() => setUserType('psychologist')}
              className="group relative flex flex-col items-center justify-center p-8 bg-accent hover:bg-accent-hover text-primary rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[280px]"
            >
              <div className="text-center">
                <div className="mb-4 text-6xl">🧠</div>
                <h2 className="text-2xl font-bold mb-2">Для психологов</h2>
                <p className="text-primary text-sm">
                  Вход для специалистов и модерации профиля
                </p>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Экран ввода email
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        {/* Кнопка назад и заголовок */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Назад"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {userType === 'client' ? 'Вход для клиентов' : 'Вход для психологов'}
          </h1>
        </div>
        
        {isSent ? (
          // Сообщение об отправке
          <div className="text-center">
            <div className="mb-4 text-5xl">📧</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Проверьте почту</h2>
            <p className="text-gray-600 mb-4">
              Мы отправили ссылку для входа на <strong className="text-gray-900">{email}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Ссылка действительна 15 минут
            </p>
            <button
              onClick={handleBack}
              className="w-full text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Ввести другой email
            </button>
          </div>
        ) : (
          // Форма ввода email
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.ru"
                autoFocus
              />
            </div>
            
            <div className="flex items-start">
              <input
                id="consent"
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="consent" className="text-sm text-gray-600">
                Даю согласие на обработку персональных данных в соответствии с{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5858E2] hover:text-[#5858E2]/80 underline"
                >
                  политикой обработки персональных данных
                </a>
                .
              </label>
            </div>
            
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !consentGiven}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                userType === 'client' 
                  ? 'bg-primary hover:bg-primary-hover text-white' 
                  : 'bg-accent hover:bg-accent-hover !text-primary'
              }`}
            >
              {isLoading ? 'Отправка...' : 'Получить ссылку для входа'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}