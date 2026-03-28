"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookieClient, setCookieClient } from "@/lib/utils/cookies";

interface ClientData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  telegram: string | null;
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

interface FormData {
  name: string;
  email: string;
  phone: string;
  telegram: string;
  message: string;
  consent: boolean;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  message?: string;
  consent?: string;
  general?: string;
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

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    telegram: "",
    message: "",
    consent: false,
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Загрузка данных клиента при открытии модалки
  useEffect(() => {
    if (isOpen) {
      const clientId = getCookieClient("clientId");
      if (clientId) {
        fetch("/api/clients/me")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setClientData(data.data);
              setFormData((prev) => ({
                ...prev,
                name: data.data.name || "",
                email: data.data.email || "",
                phone: data.data.phone || "",
                telegram: data.data.telegram || "",
              }));
            }
          })
          .catch((err) => console.error("Error loading client data:", err));
      }

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

    // Валидация email
    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }

    // Валидация сообщения
    if (!formData.message || formData.message.trim().length === 0) {
      newErrors.message = "Сообщение обязательно";
    }

    // Валидация согласия
    if (!formData.consent) {
      newErrors.consent = "Необходимо согласие на обработку персональных данных";
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
          client: {
            email: formData.email,
            name: formData.name || undefined,
            phone: formData.phone || undefined,
            telegram: formData.telegram || undefined,
            vk: undefined,
          },
          message: formData.message,
          rememberMe: formData.rememberMe,
          consent: formData.consent,
          honeypot: "", // Скрытое поле для ботов
          formOpenTime: formOpenTimeValue ? new Date(formOpenTimeValue).toISOString() : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);

        // Если rememberMe — сохраняем clientId в куки
        if (formData.rememberMe && clientData) {
          setCookieClient("clientId", clientData.id, {
            maxAge: 60 * 60 * 24 * 30, // 30 дней
            path: "/",
            sameSite: "lax",
          });
        }

        // Очищаем localStorage
        localStorage.removeItem("leadFormOpenTime");

        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setFormData({
            name: "",
            email: "",
            phone: "",
            telegram: "",
            message: "",
            consent: false,
            rememberMe: false,
          });
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
              /* Сообщение об успехе */
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
            ) : (
              /* Форма */
              <form onSubmit={handleSubmit} noValidate>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  Связаться с психологом
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
                  value={formData.telegram === "BOT_VALUE" ? "BOT_VALUE" : ""}
                  onChange={() => {}}
                />

                <div className="space-y-4">
                  {/* Имя */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Имя
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      placeholder="Как к вам обращаться"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-[#5858E2] focus:ring-[#5858E2]"
                      }`}
                      placeholder="example@mail.ru"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Телефон */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>

                  {/* Telegram / VK */}
                  <div>
                    <label htmlFor="telegram" className="block text-sm font-medium text-gray-700">
                      Telegram / VK
                    </label>
                    <input
                      type="text"
                      id="telegram"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      placeholder="@username или ссылка на VK"
                    />
                  </div>

                  {/* Сообщение */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Сообщение <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
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

                  {/* Чекбокс согласия */}
                  <div>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                      />
                      <span className="text-xs text-gray-600">
                        Я согласен на обработку{" "}
                        <a href="/s/personal-data" target="_blank" className="text-[#5858E2] underline">
                          персональных данных
                        </a>
                      </span>
                    </label>
                    {errors.consent && (
                      <p className="mt-1 text-xs text-red-600">{errors.consent}</p>
                    )}
                  </div>

                  {/* Чекбокс запомнить */}
                  <div>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                      />
                      <span className="text-xs text-gray-600">
                        Запомнить меня для будущих заявок
                      </span>
                    </label>
                  </div>

                  {/* Общая ошибка */}
                  {errors.general && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {errors.general}
                    </div>
                  )}
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
                    "Отправить заявку"
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