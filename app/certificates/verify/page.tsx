'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CertificateData {
  id: string;
  verificationCode: string;
  issuedAt: string;
  imageUrl: string;
  template: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
    isPublished: boolean;
  };
}

export default function VerifyCertificatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [hasAutoVerified, setHasAutoVerified] = useState(false);

  // Автозаполнение и автопроверка при наличии code в query params
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && !hasAutoVerified) {
      const decodedCode = decodeURIComponent(codeParam);
      setCode(decodedCode);
      
      // Автоматически запускаем проверку
      setTimeout(() => {
        verifyCertificate(decodedCode);
        setHasAutoVerified(true);
      }, 300);
    }
  }, [searchParams]);

  const verifyCertificate = async (certificateCode: string) => {
    setIsLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const response = await fetch(`/api/certificates/verify?code=${encodeURIComponent(certificateCode)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при проверке');
      }

      setCertificate(data.certificate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyCertificate(code);
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Получение полного ФИО
  const getFullFio = () => {
    if (!certificate?.user) return 'Не указан';
    const { firstName, lastName, middleName, fullName } = certificate.user;
    
    // Если есть firstName и lastName, используем их
    if (lastName && firstName) {
      const parts = [lastName, firstName];
      if (middleName) {
        parts.push(middleName);
      }
      return parts.join(' ');
    }
    
    // Фоллбэк на fullName
    return fullName || 'Не указан';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Проверка сертификата
          </h1>
          <p className="text-gray-600">
            Введите проверочный код сертификата для подтверждения подлинности
          </p>
        </div>

        {/* Форма поиска */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Проверочный код
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="А7Б9В2Г5"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-mono uppercase tracking-wider focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                maxLength={8}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Код состоит из 8 символов (кириллические буквы и цифры)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 8}
              className="w-full rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Проверка...' : 'Проверить'}
            </button>
          </div>
        </form>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Результат */}
        {certificate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-green-800">Сертификат найден</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Изображение сертификата */}
              {certificate.imageUrl && (
                <div>
                  <img
                    src={certificate.imageUrl}
                    alt="Сертификат"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Информация */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Владелец</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {getFullFio()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Дата выдачи</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(certificate.issuedAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Проверочный код</p>
                  <p className="text-2xl font-mono font-bold text-[#5858E2] tracking-wider">
                    {certificate.verificationCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ссылка назад */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}