"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ComplaintModalTriggerProps = {
  psychologistName?: string;
  psychologistSlug?: string;
  triggerLabel?: string;
  listenToComplaintLinks?: boolean;
  triggerClassName?: string;
};

const COMPLAINT_PLACEHOLDER = "Опишите, что именно произошло, когда и при каких обстоятельствах.";
const CONTACTS_LABEL =
  "Укажите ваши контакты для обратной связи. Возможно, у нас будут вопросы по вашей жалобе и нам потребуется уточнять детали. Оставьте лучший способ связи с вами.";

  const a = 'a'
const CONTACTS_PLACEHOLDER = "Телефон, email, Telegram или другой удобный способ связи.";

function isComplaintHref(rawHref: string): boolean {
  try {
    const baseOrigin =
      typeof window !== "undefined" ? window.location.origin : "https://dvmeste.ru";
    const url = new URL(rawHref, baseOrigin);
    return url.pathname === "/complaint";
  } catch {
    return false;
  }
}

export function ComplaintModalTrigger({
  psychologistName,
  psychologistSlug,
  triggerLabel = "Пожаловаться",
  listenToComplaintLinks = false,
  triggerClassName,
}: ComplaintModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPsychologistName, setTargetPsychologistName] = useState((psychologistName || "").trim());
  const [targetPsychologistSlug, setTargetPsychologistSlug] = useState((psychologistSlug || "").trim());
  const [manualPsychologistName, setManualPsychologistName] = useState((psychologistName || "").trim());
  const [complaintText, setComplaintText] = useState("");
  const [contactsText, setContactsText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!listenToComplaintLinks) return;

    const handleDocumentClick = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href") || "";
      if (!isComplaintHref(href)) return;

      event.preventDefault();

      const datasetName = (link.dataset.psychologistName || "").trim();
      const datasetSlug = (link.dataset.psychologistSlug || "").trim();

      setTargetPsychologistName(datasetName);
      setManualPsychologistName(datasetName);
      setTargetPsychologistSlug(datasetSlug);
      setErrorText(null);
      setSuccessText(null);
      setComplaintText("");
      setContactsText("");
      setIsOpen(true);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [listenToComplaintLinks]);

  const effectivePsychologistName = (manualPsychologistName || targetPsychologistName || "").trim();
  const dialogTitle = useMemo(() => {
    return effectivePsychologistName ? `Жалоба на ${effectivePsychologistName}` : "Жалоба на психолога";
  }, [effectivePsychologistName]);

  const resetAndClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setErrorText(null);
    setSuccessText(null);
    setComplaintText("");
    setContactsText("");
    if (!listenToComplaintLinks) {
      setTargetPsychologistName((psychologistName || "").trim());
      setTargetPsychologistSlug((psychologistSlug || "").trim());
      setManualPsychologistName((psychologistName || "").trim());
    }
  };

  const openModal = (event?: MouseEvent<HTMLButtonElement>) => {
    if (event) event.preventDefault();
    setTargetPsychologistName((psychologistName || "").trim());
    setTargetPsychologistSlug((psychologistSlug || "").trim());
    setManualPsychologistName((psychologistName || "").trim());
    setIsOpen(true);
    setErrorText(null);
    setSuccessText(null);
    setComplaintText("");
    setContactsText("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const psychologist = (manualPsychologistName || targetPsychologistName || "").trim();
    const complaint = complaintText.trim();
    const contacts = contactsText.trim();
    if (!psychologist) {
      setErrorText("Укажите ФИО психолога.");
      return;
    }
    if (!complaint || complaint.length < 10) {
      setErrorText("Опишите суть жалобы подробнее (минимум 10 символов).");
      return;
    }
    if (!contacts || contacts.length < 10) {
      setErrorText("Укажите контакты для обратной связи (минимум 10 символов).");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const sourceUrl = typeof window !== "undefined" ? window.location.href : "";
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychologistName: psychologist,
          psychologistSlug: targetPsychologistSlug || "",
          complaintText: complaint,
          contactsText: contacts,
          sourceUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error || "Не удалось отправить жалобу.");
      }

      setSuccessText("Жалоба отправлена. Спасибо за обращение.");
      setComplaintText("");
      setContactsText("");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось отправить жалобу.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!listenToComplaintLinks && (
        <button
          type="button"
          onClick={openModal}
          className={cn(
            "text-xs text-gray-600 hover:text-[#5858E2] sm:text-sm",
            triggerClassName
          )}
        >
          {triggerLabel}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="pr-4 text-base font-semibold text-gray-900 sm:text-lg">{dialogTitle}</h2>
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isSubmitting}
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div>
                <label htmlFor="psychologistName" className="mb-1 block text-sm font-medium text-gray-800">
                  ФИО психолога
                </label>
                <input
                  id="psychologistName"
                  name="psychologistName"
                  type="text"
                  value={manualPsychologistName}
                  onChange={(event) => setManualPsychologistName(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-[#5858E2]/30 transition focus:border-[#5858E2] focus:ring-2"
                  placeholder="ФИО психолога"
                />
              </div>

              <div>
                <label htmlFor="complaintText" className="mb-1 block text-sm font-medium text-gray-800">
                  Опишите суть жалобы
                </label>
                <textarea
                  id="complaintText"
                  name="complaintText"
                  value={complaintText}
                  onChange={(event) => setComplaintText(event.target.value)}
                  required
                  rows={5}
                  placeholder={COMPLAINT_PLACEHOLDER}
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-[#5858E2]/30 transition focus:border-[#5858E2] focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="contactsText" className="mb-1 block text-sm font-medium text-gray-800">
                  {CONTACTS_LABEL}
                </label>
                <textarea
                  id="contactsText"
                  name="contactsText"
                  value={contactsText}
                  onChange={(event) => setContactsText(event.target.value)}
                  required
                  rows={4}
                  placeholder={CONTACTS_PLACEHOLDER}
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-[#5858E2]/30 transition focus:border-[#5858E2] focus:ring-2"
                />
              </div>

              {errorText && <p className="text-sm text-red-700">{errorText}</p>}
              {successText && <p className="text-sm text-green-700">{successText}</p>}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetAndClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c4cd3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Отправляем..." : "Отправить жалобу"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
