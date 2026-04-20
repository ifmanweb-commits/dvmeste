'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AwardModal } from '../catalog/AwardModal';

interface AwardRecord {
  id: string;
  title: string;
  description: string | null;
  awardedAt: string | Date;
  certificationId: string | null;
  badgeUrl: string | null;
  rewardType: string;
  hasCertification: boolean;
  explanationText?: string | null;
}

interface AwardsSectionProps {
  awards: AwardRecord[];
  certifications: any[];
  userCertificates: any[];
}

export function AwardsSection({ awards, certifications, userCertificates }: AwardsSectionProps) {
  const [selectedAward, setSelectedAward] = useState<AwardRecord | null>(null);

  const handleAwardClick = (e: React.MouseEvent, award: AwardRecord) => {
    // Если у награды нет certificationId, открываем модальное окно
    if (!award.certificationId) {
      e.preventDefault();
      setSelectedAward(award);
    }
  };

  const handleCloseModal = () => {
    setSelectedAward(null);
  };

  return (
    <>
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Полученные награды
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {awards.map((reward) => {
            const awardedYear = new Date(reward.awardedAt).getFullYear();
            
            // Определяем изображение для отображения
            let imageUrl = '/images/icons/award-gold-500-tp.png';
            let imageAlt = 'Награда получена';
            let linkHref = reward.certificationId ? `/account/certification/${reward.certificationId}` : '#';
            
            if (reward.rewardType === 'BADGE' && reward.badgeUrl) {
              // Для ачивки используем badgeUrl
              imageUrl = reward.badgeUrl;
              imageAlt = `Ачивка: ${reward.title}`;
            } else if (reward.rewardType === 'CERTIFICATE' && reward.certificationId) {
              // Для сертификата ищем сгенерированный сертификат
              const cert = certifications.find(c => c.id === reward.certificationId);
              if (cert?.certificateTemplateId) {
                const generatedCert = userCertificates.find(
                  (gc) => gc.templateId === cert.certificateTemplateId
                );
                if (generatedCert && generatedCert.imageUrl) {
                  imageUrl = generatedCert.imageUrl;
                  imageAlt = `Сертификат: ${reward.title}`;
                }
              }
            }
            
            return (
              <div
                key={reward.id}
                className="group relative overflow-hidden rounded-2xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#5858E2]/40"
              >
                {/* Бейдж с иконкой */}
                <div className="mb-2 flex justify-center">
                  <div className="transition-transform group-hover:scale-105">
                    {!reward.certificationId ? (
                      <button
                        onClick={(e) => handleAwardClick(e, reward)}
                        className="cursor-pointer"
                        type="button"
                      >
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          width={200}
                          height={200}
                          className="h-56 w-56 object-contain"
                        />
                      </button>
                    ) : (
                      <Link
                        href={linkHref}
                      >
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          width={200}
                          height={200}
                          className="h-56 w-56 object-contain"
                        />
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Год */}
                <p className="mb-1 text-center text-sm font-medium text-gray-500">
                  {awardedYear}
                </p>
                
                {/* Название награды */}
                <h3 className="text-center text-base font-semibold text-gray-900 group-hover:text-[#5858E2]">
                  {!reward.certificationId ? (
                    <button
                      onClick={(e) => handleAwardClick(e, reward)}
                      className="hover:text-[#5858E2] hover:underline"
                      type="button"
                    >
                      {reward.title}
                    </button>
                  ) : (
                    <Link href={linkHref}>
                      {reward.title}
                    </Link>
                  )}
                </h3>
              </div>
            );
          })}
        </div>
      </section>

      {/* Модальное окно награды */}
      {selectedAward && (
        <AwardModal
          isOpen={true}
          onClose={handleCloseModal}
          title={selectedAward.title}
          imageUrl={
            selectedAward.rewardType === 'BADGE' && selectedAward.badgeUrl
              ? selectedAward.badgeUrl
              : '/images/icons/award-gold-500-tp.png'
          }
          explanationText={selectedAward.explanationText || null}
        />
      )}
    </>
  );
}