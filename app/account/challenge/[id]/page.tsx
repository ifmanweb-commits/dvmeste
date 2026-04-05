'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Динамически импортируем компоненты для TEST и WORK
const TestChallengePage = dynamic(() => import('./TestChallengePage'), { ssr: false });
const WorkChallengePage = dynamic(() => import('./WorkChallengePage'), { ssr: false });

type ChallengeType = 'TEST' | 'WORK' | null;

export default function ChallengePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const attemptId = searchParams.get('attempt');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<ChallengeType>(null);

  // Определяем тип испытания
  useEffect(() => {
    async function loadChallengeType() {
      try {
        const res = await fetch(`/api/challenge/${id}/type`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load challenge');
        }

        setChallengeType(data.type);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadChallengeType();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#5858E2] border-t-transparent" />
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Рендерим соответствующий компонент в зависимости от типа
  if (challengeType === 'TEST') {
    return <TestChallengePage challengeId={id} attemptId={attemptId} />;
  }

  if (challengeType === 'WORK') {
    return <WorkChallengePage challengeId={id} attemptId={attemptId} />;
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Неизвестный тип испытания</p>
      </div>
    </div>
  );
}