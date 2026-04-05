'use client';

import { useState } from 'react';

interface WorkChallengePageProps {
  challengeId: string;
}

export default function WorkChallengePage({ challengeId }: WorkChallengePageProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [transcriptUrl, setTranscriptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Отправка работы
  const submitWork = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/challenge/${challengeId}/work/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, transcriptUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitMessage('Работа отправлена на проверку!');
      setVideoUrl('');
      setTranscriptUrl('');
    } catch (err: any) {
      setSubmitMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Форма отправки работы */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Отправка работы
        </h2>

        {submitMessage && (
          <div className={`mb-4 rounded-lg p-4 ${
            submitMessage.includes('ошибка') || submitMessage.includes('Failed')
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}>
            {submitMessage}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на видео
          </label>
          <input
            id="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="mb-4">
          <label htmlFor="transcriptUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на расшифровку
          </label>
          <input
            id="transcriptUrl"
            type="url"
            value={transcriptUrl}
            onChange={(e) => setTranscriptUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={submitWork}
          disabled={isSubmitting || !videoUrl.trim() || !transcriptUrl.trim()}
          className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
        </button>
      </div>
    </div>
  );
}