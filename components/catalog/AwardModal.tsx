'use client';

import { useEffect } from 'react';

interface AwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string | null;
  explanationText: string | null;
}

export function AwardModal({
  isOpen,
  onClose,
  title,
  imageUrl,
  explanationText,
}: AwardModalProps) {
  // Блокировка скролла при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" 
      role="dialog" 
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="relative h-full w-full sm:max-w-2xl sm:h-auto sm:rounded-2xl sm:shadow-2xl bg-white sm:m-4 overflow-hidden">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 hover:bg-white hover:text-gray-700 shadow-md"
          aria-label="Закрыть"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Контент модального окна */}
        <div className="flex h-full flex-col">
          {/* Изображение награды */}
          <div className="flex items-center justify-center bg-gray-50 p-6 sm:p-8">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="max-h-64 w-auto object-contain sm:max-h-80"
              />
            ) : (
              <div className="text-gray-400">Изображение недоступно</div>
            )}
          </div>

          {/* Текст и кнопка */}
          <div className="flex-1 bg-white p-6 sm:p-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
              {title}
            </h2>
            
            {explanationText ? (
              <p className="mb-6 text-gray-700 sm:text-lg">
                {explanationText}
              </p>
            ) : (
              <p className="mb-6 text-gray-500 italic">
                Описание не указано
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#5858E2] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#4a4ac9] sm:w-auto sm:px-8"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}