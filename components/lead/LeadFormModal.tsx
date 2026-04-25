"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ClientData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  vk: string | null;
}

interface LeadFormModalProps {
  psychologistId: string;
  psychologistName?: string;
  onSuccess?: () => void;
  triggerLabel?: string;
  triggerClassName?: string;
  large?: boolean;
}

interface FormErrors {
  message?: string;
  general?: string;
  auth?: string;
}

export default function LeadFormModal({
  psychologistId,
  psychologistName,
  onSuccess,
  triggerLabel = "Связаться",
  triggerClassName,
  large = false,
}: LeadFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formOpenTime, setFormOpenTime] = useState<number | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  // Проверка авторизации при открытии модалки
  useEffect(() => {
    if (isOpen) {
      const checkAuth = async () => {
        try {
          const res = await fetch("/api/client/account/me");
          if (res.ok) {
            const data = await res.json();
            setClientData(data);
            setIsAuthenticated(true);
          } else if (res.status === 401) {
            setIsAuthenticated(false);
          } else {
            // Ошибка сервера
            setErrors({ general: "Ошибка проверки авторизации. Попробуйте позже." });
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error checking auth:", error);
          setErrors({ general: "Ошибка соединения с сервером" });
          setIsAuthenticated(false);
        }
      };
      checkAuth();

      // Записываем время открытия формы
      const openTime = Date.now();
      setFormOpenTime(openTime);
      localStorage.setItem("leadFormOpenTime", openTime.toString());
    }
  }, [isOpen]);

  // Закрытие модалки по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Блокировка прокрутки фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация сообщения
    if (!message || message.trim().length === 0) {
      newErrors.message = "Сообщение обязательно";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Получаем время открытия формы из localStorage
      const openTime = localStorage.getItem("leadFormOpenTime");
      const formOpenTimeValue = openTime ? parseInt(openTime, 10) : null;

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychologistId,
          message: message,
          honeypot: "", // Скрытое поле для ботов
          formOpenTime: formOpenTimeValue ? new Date(formOpenTimeValue).toISOString() : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);

        // Очищаем localStorage
        localStorage.removeItem("leadFormOpenTime");

        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setMessage("");
          onSuccess?.();
        }, 2000);
      } else {
        setErrors({ general: result.error || "Ошибка при отправке заявки" });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ general: "Ошибка при отправке заявки" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
      localStorage.removeItem("leadFormOpenTime");
    }
  }, [isLoading]);

  return (
    <>
      {/* Кнопка открытия модалки */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          `inline-flex items-center justify-center rounded-lg bg-[#5858E2] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#4d4dd0] ${
            large ? "px-6 py-3 text-base" : ""
          }`
        }
      >
        {triggerLabel}
      </button>

      {/* Модалка */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label="Закрыть"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {isSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Заявка отправлена!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Психолог получит уведомление и свяжется с вами в ближайшее время.
                </p>
              </div>
            ) : isAuthenticated === false ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Зарегистрируйтесь, чтобы подать заявку психологу</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Для отправки заявки необходимо войти в личный кабинет клиента
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block bg-[#5858E2] text-white py-2 px-6 rounded-lg hover:bg-[#4d4dd0] transition-colors"
                >
                  Войти / Зарегистрироваться
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  Записаться к психологу
                </h3>
                {psychologistName && (
                  <p className="mb-4 text-sm text-gray-500">{psychologistName}</p>
                )}

                {/* Honeypot - скрытое поле для ботов */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  value=""
                  readOnly
                />

                {/* Сообщение об общей ошибке */}
                {errors.general && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Сообщение */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      С чем хотите поработать <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors.message
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-[#5858E2] focus:ring-[#5858E2]"
                      }`}
                      placeholder="Коротко расскажите вашу ситуацию и тему обращения, чтобы психолог мог сразу сориентироваться - сможет ли эффективно вам помочь."
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                    )}
                  </div>
                </div>

                {/* Кнопка отправки */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d4dd0] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Отправка...
                    </>
                  ) : (
                    "Записаться"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}