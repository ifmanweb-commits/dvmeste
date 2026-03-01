"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EducationFormEdit } from '@/components/admin/EducationFormEdit';
import { parseEducationFromDB } from "@/lib/education-helpers";
import DeletePsychologistButton from "@/components/psychologist/DeletePsychologistButton";
import { ParadigmSelector } from "@/components/admin/ParadigmSelector";
import { updatePsychologist } from "@/lib/actions/manager-psychologist";                   


interface EditPsychologistFormProps {
  psychologist: any;
  psychologistId: string;
  initialWorkFormats: string[];
  initialCertificationLevels: string[];
}

export default function EditPsychologistForm({
                                               psychologist,
                                               psychologistId,
                                               initialWorkFormats,
                                               initialCertificationLevels
                                             }: EditPsychologistFormProps) {
  const router = useRouter();

  const [urls, setUrls] = useState<string[]>(psychologist.images || []);
  const [files, setFiles] = useState<(File | null)[]>(() =>
    (psychologist.images || []).map(() => null)
  );
  const [newUrl, setNewUrl] = useState("");
  const [slug, setSlug] = useState(psychologist.slug || "");
  const formRef = useRef<HTMLFormElement>(null);
  const [educationData, setEducationData] = useState<any[]>(parseEducationFromDB(psychologist.education ?? []));
  const [workFormats] = useState<string[]>(initialWorkFormats);
  const [certificationLevels] = useState<string[]>(initialCertificationLevels);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

                              
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

                                    
    value = value.replace(/[^a-zA-Z0-9\-]/g, '');
    value = value.toLowerCase();

    setSlug(value);
  };

                            
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = urls.length + selectedFiles.length;

      if (totalFiles > 5) {
        alert("Можно загрузить максимум 5 файлов");
        return;
      }

      setFiles(prev => [...prev, ...selectedFiles]);

                                                
      const tempUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setUrls(prev => [...prev, ...tempUrls]);
    }
  };

                     
  const removeItem = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUrls(prev => {
      const newUrls = [...prev];
                                  
      if (newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      return newUrls.filter((_, i) => i !== index);
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= urls.length) return;

    setUrls((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });

    setFiles((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

                 
  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || urls.length >= 5) return;

                               
    const isValid = /^(https?:\/\/|\/)/.test(trimmed) ||
        /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed);

    if (!isValid) {
      alert("Пожалуйста, введите корректный URL изображения");
      return;
    }

    setUrls(prev => [...prev, trimmed]);
    setFiles(prev => [...prev, null]);
    setNewUrl("");
  };

                   
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!psychologist || !psychologistId) return;

    if (!slug.trim()) {
      setErrorMessage("Slug обязателен для заполнения.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(formRef.current!);

    const orderedImages: Array<{ type: "file"; fileIndex: number } | { type: "url"; url: string }> = [];
    let fileIndex = 0;

    urls.forEach((url, index) => {
      const file = files[index];
      if (file) {
        formData.append("images", file);
        orderedImages.push({ type: "file", fileIndex });
        fileIndex += 1;
        return;
      }

      if (!url.startsWith("blob:")) {
        orderedImages.push({ type: "url", url });
      }
    });

    if (orderedImages.length > 0) {
      formData.set("orderedImages", JSON.stringify(orderedImages));
      const imageUrls = orderedImages
        .filter((item): item is { type: "url"; url: string } => item.type === "url")
        .map((item) => item.url);
      if (imageUrls.length > 0) {
        formData.set("imageUrls", imageUrls.join("\n"));
      } else {
        formData.delete("imageUrls");
      }
    }

                                               
    formData.append("education", JSON.stringify(educationData));

    console.log("📤 Отправка формы редактирования...");
    console.log("📎 Файлов:", files.length);
    console.log("🔗 URL:", orderedImages.filter((item) => item.type === "url").length);
    console.log("📚 Образование:", educationData);
    console.log("ID психолога:", psychologistId);

    try {
      await updatePsychologist(psychologistId, formData);
                                                   
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      setErrorMessage(error instanceof Error ? error.message : "Ошибка обновления психолога");
      setIsSubmitting(false);
    }
  };

                                                
  const handleEducationUpdate = (updatedEducation: any[]) => {
    setEducationData(updatedEducation);
  };

                                              
  useEffect(() => {
    return () => {
      urls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [urls]);

  return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">
              Редактировать: {psychologist.fullName}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              ID: {psychologist.id} | Создано: {new Date(psychologist.createdAt).toLocaleDateString('ru-RU')}
            </p>

            {errorMessage && (
                <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-800">
                  <p className="font-medium">{errorMessage}</p>
                </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-8">
              {                         }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Основная информация</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ФИО *
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        required
                        defaultValue={psychologist.fullName}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL адрес страницы *
                      <span className="ml-2 text-xs text-amber-600">только латиница, цифры, дефис</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">/psy-list/</span>
                    <input
                          type="text"
                          name="slug"
                          value={slug}
                          onChange={handleSlugChange}
                          required
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                      />
                    </div>

                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                    <select
                        name="gender"
                        defaultValue={psychologist.gender}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    >
                      <option value="М">Мужской</option>
                      <option value="Ж">Женский</option>
                      <option value="Не указан">Не указан</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата рождения
                    </label>
                    <input
                        type="date"
                        name="birthDate"
                        defaultValue={psychologist.birthDate?.toISOString().slice(0, 10)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                  <input
                      type="text"
                      name="city"
                      defaultValue={psychologist.city || ""}
                      placeholder="Москва, Санкт-Петербург..."
                      className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  />
                </div>
              </div>

              {                                 }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Профессиональная информация</h2>

                {                   }
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Формат работы</label>
                  <select
                      name="workFormat"
                      defaultValue={psychologist.workFormat}
                      className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  >
                    <option value="">Выберите формат работы</option>
                    {workFormats.map((format, index) => (
                        <option key={index} value={format}>
                          {format}
                        </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата первого диплома
                    </label>
                    <input
                        type="date"
                        name="firstDiplomaDate"
                        defaultValue={psychologist.firstDiplomaDate?.toISOString().slice(0, 10) || ""}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата последней сертификации
                    </label>
                    <input
                        type="date"
                        name="lastCertificationDate"
                        defaultValue={psychologist.lastCertificationDate?.toISOString().slice(0, 10) || ""}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>
                </div>

                {                               }
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Парадигмы
                  </label>
                  <ParadigmSelector
                      defaultValue={psychologist.mainParadigm || []}
                  />
                </div>

                {                          }
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Уровень сертификации
                  </label>
                  <select
                      name="certificationLevel"
                      defaultValue={psychologist.certificationLevel}
                      className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  >
                    {certificationLevels.map((level, index) => (
                        <option key={index} value={parseInt(level)}>
                          Уровень {level}
                        </option>
                    ))}
                  </select>
                </div>
              </div>

              {            }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">О психологе</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    О себе кратко (до 400 символов)
                  </label>
                  <textarea
                      name="shortBio"
                      maxLength={400}
                      rows={3}
                      defaultValue={psychologist.shortBio || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    О себе подробно
                  </label>
                  <textarea
                      name="longBio"
                      rows={6}
                      defaultValue={psychologist.longBio || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                  />
                </div>
              </div>

              {                     }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Контакты и стоимость</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Стоимость сеанса (₽)
                    </label>
                    <input
                        type="number"
                        name="price"
                        min={0}
                        defaultValue={psychologist.price}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Контакты
                    </label>
                    <textarea
                        name="contactInfo"
                        rows={3}
                        defaultValue={psychologist.contactInfo || ""}
                        placeholder="Телефон, Email, Telegram..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                    />
                  </div>
                </div>
              </div>

              {                }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Фотографии</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фото психолога (основное + до 4 дополнительных)
                  </label>

                  {                     }
                  <div className="mb-4">
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 file:mr-4 file:rounded-lg file:border-0 file:bg-[#4CAF50] file:px-4 file:py-2 file:text-white hover:file:bg-[#43A047]"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Можно выбрать несколько файлов. Максимум 5 файлов.
                    </p>
                  </div>

                  {                       }
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                          type="text"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                          placeholder="https://example.com/photo.jpg или /uploads/filename.jpg"
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20"
                      />
                      <button
                          type="button"
                          onClick={addUrl}
                          disabled={!newUrl.trim() || urls.length >= 5}
                          className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                      >
                        Добавить URL
                      </button>
                    </div>
                  </div>

                  {                                  }
                  {urls.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Выбранные изображения ({urls.length}/5):
                        </p>
                        <p className="mb-2 text-xs text-gray-500">Используйте ↑ ↓ для изменения порядка.</p>
                        <div className="space-y-2">
                          {urls.map((url, index) => (
                              <div
                                  key={index}
                                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded border border-gray-300 overflow-hidden bg-white">
                                    <img
                                        src={url}
                                        alt={`Изображение ${index + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="Arial" font-size="8" fill="%239ca3af" text-anchor="middle" dy=".3em">IMG</text></svg>';
                                        }}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {files[index]?.name || url.split('/').pop() || `Изображение ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {url.startsWith('blob:') ? 'Локальный файл' : 'Внешняя ссылка'}
                                      {index === 0 && ' • Основное'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                      type="button"
                                      onClick={() => moveItem(index, -1)}
                                      disabled={index === 0}
                                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                      title="Переместить выше"
                                  >
                                    ↑
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => moveItem(index, 1)}
                                      disabled={index === urls.length - 1}
                                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                      title="Переместить ниже"
                                  >
                                    ↓
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => removeItem(index)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Удалить"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {                }
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Важно:</span> Файлы будут загружены на сервер.
                      Первое изображение в списке будет основным.
                    </p>
                  </div>
                </div>
              </div>

              {                 }
              <div>
                <EducationFormEdit
                    initialData={educationData}
                    onEducationUpdate={handleEducationUpdate}
                />
              </div>

              {                }
              <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    defaultChecked={psychologist.isPublished}
                    className="h-4 w-4 rounded border-gray-300 text-[#4CAF50] focus:ring-[#4CAF50]"
                />
                <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
                  Показывать на сайте
                </label>
              </div>

              {                     }
              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#4CAF50] px-8 py-3 font-medium text-white hover:bg-[#43A047] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                      <>
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        Сохранение...
                      </>
                  ) : (
                      "Сохранить изменения"
                  )}
                </button>
                <Link
                    href="/managers/psychologists"
                    className="rounded-xl border border-gray-300 px-8 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </Link>
              </div>
            </form>

            {              }
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-lg font-semibold text-red-800">Опасная зона</h3>
                <p className="mt-1 text-sm text-red-700">
                  Удаление анкеты психолога необратимо. Все данные будут безвозвратно удалены.
                </p>
                <div className="mt-3">
                  <DeletePsychologistButton id={psychologist.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
