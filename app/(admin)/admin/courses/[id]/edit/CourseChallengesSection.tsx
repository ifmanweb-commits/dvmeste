"use client";

import { useState } from "react";
import { addCourseChallenge, removeCourseChallenge } from "@/lib/actions/course-challenges";

interface Challenge {
  id: string;
  title: string;
  slug: string;
  test: {
    questionsCount: number;
    passingScore: number;
  } | null;
}

interface CourseChallengesSectionProps {
  courseId: string;
  challenges: Challenge[];
  selectedChallengeIds: string[];
  status: "enrolled" | "graduated";
  title: string;
}

export default function CourseChallengesSection({
  courseId,
  challenges,
  selectedChallengeIds,
  status,
  title,
}: CourseChallengesSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");

  const handleAdd = async () => {
    if (!selectedChallengeId) return;

    setIsSubmitting(true);
    setError(null);

    const result = await addCourseChallenge(courseId, selectedChallengeId, status);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Ошибка при добавлении теста");
    } else {
      setSelectedChallengeId("");
      window.location.reload();
    }
  };

  const handleRemove = async (challengeId: string) => {
    if (!confirm("Удалить эту связь?")) return;

    setIsSubmitting(true);
    setError(null);

    const result = await removeCourseChallenge(courseId, challengeId, status);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Ошибка при удалении теста");
    } else {
      window.location.reload();
    }
  };

  const availableChallenges = challenges.filter(
    (c) => !selectedChallengeIds.includes(c.id)
  );

  const selectedChallenges = challenges.filter((c) =>
    selectedChallengeIds.includes(c.id)
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Добавление нового теста */}
      <div className="mb-6 flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor={`challenge-${status}`}
            className="block text-sm font-medium text-gray-700"
          >
            Добавить испытание
          </label>
          <select
            id={`challenge-${status}`}
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          >
            <option value="">Выберите испытание...</option>
            {availableChallenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title} ({challenge.test?.questionsCount} вопросов)
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedChallengeId || isSubmitting}
          className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Добавление..." : "Добавить"}
        </button>
      </div>

      {/* Список добавленных тестов */}
      {selectedChallenges.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Тесты ещё не добавлены
        </p>
      ) : (
        <ul className="space-y-2">
          {selectedChallenges.map((challenge) => (
            <li
              key={challenge.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{challenge.title}</p>
                <p className="text-sm text-gray-500">
                  Slug: {challenge.slug} |{" "}
                  {challenge.test?.questionsCount || "?"} вопросов | Проходной:{" "}
                  {challenge.test?.passingScore || "?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(challenge.id)}
                disabled={isSubmitting}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}