'use client';

import { useEffect, useState } from 'react';
import { AwardModal } from './AwardModal';

interface CertificateTemplate {
  id: string;
  name: string;
  slug: string;
  backgroundUrl: string;
}

interface Certification {
  id: string;
  slug: string;
  title: string;
  rewardType: string;
  badgeUrl: string | null;
  certificateTemplate: CertificateTemplate | null;
  awardedAt: string | null;
  verificationCode: string | null;
  certificateImageUrl: string | null;
  explanationText: string | null;
}

interface CertificationsBlockProps {
  psychologistSlug: string;
}

export function CertificationsBlock({ psychologistSlug }: CertificationsBlockProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAward, setSelectedAward] = useState<Certification | null>(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const response = await fetch(`/api/psychologists/${psychologistSlug}/certifications`);
        if (!response.ok) {
          throw new Error('Ошибка при загрузке наград');
        }
        const data = await response.json();
        setCertifications(data);
      } catch (err: any) {
        console.error('Error fetching certifications:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (psychologistSlug) {
      fetchCertifications();
    }
  }, [psychologistSlug]);

  const handleAwardClick = (cert: Certification) => {
    setSelectedAward(cert);
  };

  const handleCloseModal = () => {
    setSelectedAward(null);
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Награды и сертификации
        </h2>
        <div className="animate-pulse">
          <div className="h-32 rounded-lg bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error || certifications.length === 0) {
    return null;
  }

  // Получаем URL изображения для награды
  const getAwardImageUrl = (cert: Certification): string | null => {
    // Если есть сгенерированный сертификат, используем его
    if (cert.certificateImageUrl) {
      return cert.certificateImageUrl;
    }
    // Иначе используем бейдж или шаблон
    if (cert.rewardType === 'badge' && cert.badgeUrl) {
      return cert.badgeUrl;
    }
    if (cert.rewardType === 'certificate' && cert.certificateTemplate?.backgroundUrl) {
      return cert.certificateTemplate.backgroundUrl;
    }
    return null;
  };


  return (
    <div className="mt-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Награды и сертификации
      </h2>
      <div className="flex flex-wrap gap-4">
        {certifications.map((cert) => {
          const imageUrl = getAwardImageUrl(cert);
          if (!imageUrl) return null;
          
          // Если есть verificationCode, делаем ссылку на страницу проверки
          const linkUrl = cert.verificationCode 
            ? `/certificates/verify?code=${encodeURIComponent(cert.verificationCode)}` 
            : null;
          
          return (
            <div
              key={cert.id}
              className="flex flex-col items-center"
            >
              {linkUrl ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-opacity hover:opacity-80"
                  title={`Сертификат: ${cert.title}`}
                >
                  <img
                    src={imageUrl}
                    alt={cert.title}
                    className="h-24 w-auto object-contain rounded-lg bg-white cursor-pointer"
                  />
                </a>
              ) : (
                <button
                  onClick={() => handleAwardClick(cert)}
                  className="block transition-opacity hover:opacity-80"
                  title={`Награда: ${cert.title}`}
                >
                  <img
                    src={imageUrl}
                    alt={cert.title}
                    className="h-24 w-auto object-contain rounded-lg bg-white cursor-pointer"
                  />
                </button>
              )}
              {/* Подпись с названием квалификации */}
              <span className="mt-1 text-xs text-gray-600 text-center max-w-[150px]">
                {cert.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Модальное окно награды */}
      {selectedAward && (
        <AwardModal
          isOpen={true}
          onClose={handleCloseModal}
          title={selectedAward.title}
          imageUrl={getAwardImageUrl(selectedAward)}
          explanationText={selectedAward.explanationText}
        />
      )}
    </div>
  );
}
