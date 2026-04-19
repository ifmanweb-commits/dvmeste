"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Проверяем cookie после монтирования компонента
    const hasConsent = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("cookie_consent="));

    if (!hasConsent) {
      // Небольшая задержка перед показом для плавности
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    }
  }, []);

  const handleAccept = async () => {
    setIsAnimating(true);
    
    try {
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error saving cookie consent:", error);
    }
    
    // Скрываем баннер с анимацией
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        isAnimating ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 text-sm text-gray-700">
            <h3 className="font-semibold text-gray-900 mb-2">
              Уведомление о кукис
            </h3>
            <p className="text-gray-600">
              «Давай вместе» защищает персональные данные пользователей и обрабатывает Cookies только для персонализации сервисов. 
              Запретить обработку Cookies можно в настройках вашего браузера. 
              Пожалуйста, ознакомьтесь с{" "}
              <a
                href="/cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5858E2] hover:text-[#4848d0] underline"
              >
                Политикой обработки cookies
              </a>
              . Подробно рассказываем, как «Давай вместе» обрабатывает и защищает ваши персональные данные{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5858E2] hover:text-[#4848d0] underline"
              >
                на странице
              </a>
              .
            </p>
          </div>
          <div className="flex-shrink-0 sm:ml-4">
            <button
              onClick={handleAccept}
              className="inline-flex items-center justify-center rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#4848d0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:ring-offset-2"
            >
              Принять
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}