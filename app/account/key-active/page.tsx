'use client';

import { useState } from 'react';

interface PreviewAction {
  type: string;
  label: string;
  description: string;
}

export default function KeyActivePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    actions: PreviewAction[];
    keyId: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    executedActions?: string[];
  } | null>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPreview(null);
    setPreviewError(null);
    setResult(null);

    try {
      const response = await fetch('/api/key-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreview({
          actions: data.actions,
          keyId: data.keyId,
        });
      } else {
        setPreviewError(data.error || 'Ошибка проверки ключа');
      }
    } catch (error) {
      setPreviewError('Произошла ошибка при проверке ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setResult(null);

    try {
      const response = await fetch('/api/key-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          executedActions: data.executedActions,
        });
        setCode('');
        setPreview(null);
      } else {
        setResult({
          success: false,
          error: data.error || 'Ошибка активации ключа',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Произошла ошибка при активации ключа',
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Активация ключа</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {!preview ? (
          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Код ключа
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KEY-XXXX-XXXX"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Введите код ключа, который вы получили
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full rounded-lg bg-[#5858E2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Проверить ключ'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">
                Этот ключ выполнит следующие действия:
              </p>
              <ul className="space-y-2">
                {preview.actions.map((action, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5858E2]/10 text-[#5858E2] text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{action.label}</p>
                      {action.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setCode('');
                }}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={activating}
                className="flex-1 rounded-lg bg-[#5858E2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activating ? 'Активация...' : 'Активировать'}
              </button>
            </div>
          </div>
        )}

        {(previewError || result) && (
          <div
            className={`mt-6 rounded-lg p-4 ${
              result?.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result?.success ? (
              <>
                <p className="text-sm font-medium text-green-800">{result.message}</p>
                {result.executedActions && result.executedActions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Выполненные действия:
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      {result.executedActions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-red-800">
                {result?.error || previewError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}