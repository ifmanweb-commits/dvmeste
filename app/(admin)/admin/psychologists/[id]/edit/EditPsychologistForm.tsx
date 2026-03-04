"use client";

import Link from "next/link";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { EducationFormEdit } from '@/components/admin/EducationFormEdit';
import { parseEducationFromDB } from "@/lib/education-helpers";
import { updatePsychologist, getPsychologistById } from "@/lib/actions/admin-psychologists";
import { getDataListItems } from "@/lib/actions/admin-references";
import { ParadigmSelector } from "@/components/admin/ParadigmSelector";

function EditPsychologistForm() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const errorCode = searchParams.get("error") || "";

  const errorMessage = errorCode === "duplicate_slug"
      ? "Пользователь с таким slug уже есть. Укажите другой адрес страницы."
      : errorCode === "invalid_file_type"
          ? "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF"
          : errorCode === "file_too_large"
              ? "Файл слишком большой. Максимальный размер: 5MB"
              : null;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Для фотографий - работаем с документами типа PHOTO
  const [photos, setPhotos] = useState<Array<{
    id?: string           // id существующего документа
    url: string
    file?: File           // если это новый файл
    isNew?: boolean       // флаг для новых файлов
  }>>([]);
  
  const [newUrl, setNewUrl] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [educationData, setEducationData] = useState<any[]>([]);
  const [workFormats, setWorkFormats] = useState<string[]>([]);
  const [certificationLevels, setCertificationLevels] = useState<string[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);
  const loadedReferencesRef = useRef(false);

  // Загрузка данных пользователя
  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        console.error("ID не найден");
        router.push("/admin/psychologists");
        return;
      }

      if (loadedUserIdRef.current === id) return;
      loadedUserIdRef.current = id;

      try {
        setLoading(true);
        const data = await getPsychologistById(id);

        if (!data) {
          router.push("/admin/psychologists?error=not_found");
          return;
        }

        setUser(data);
        
        // Загружаем фотографии из документов (только тип PHOTO)
        const userPhotos = data.documents
          ?.filter((doc: any) => doc.type === 'PHOTO')
          .map((doc: any) => ({
            id: doc.id,
            url: doc.url,
            isNew: false
          })) || [];
        
        setPhotos(userPhotos);
        
        // Парсим образование
        setEducationData(parseEducationFromDB(data.education ?? []));
      } catch (error) {
        console.error("Ошибка загрузки пользователя:", error);
        router.push("/admin/psychologists?error=load_failed");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, router]);

  // Загрузка справочников
  useEffect(() => {
    const loadReferences = async () => {
      if (loadedReferencesRef.current) return;
      loadedReferencesRef.current = true;

      try {
        setReferencesLoading(true);
        const [formats, levels] = await Promise.all([
          getDataListItems('work-formats'),
          getDataListItems('certification-levels'),
        ]);

        setWorkFormats(formats);
        setCertificationLevels(levels);
      } catch (error) {
        console.error('Error loading references:', error);
        // Значения по умолчанию
        setWorkFormats(['Онлайн', 'Оффлайн', 'Онлайн и оффлайн', 'Переписка']);
        setCertificationLevels(['1', '2', '3']);
      } finally {
        setReferencesLoading(false);
      }
    };

    loadReferences();
  }, []);

  // Обработчики файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = photos.length + selectedFiles.length;

      if (totalFiles > 5) {
        alert("Можно загрузить максимум 5 фотографий");
        return;
      }

      const newPhotos = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        file,
        isNew: true
      }));

      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    const photo = photos[index];
    
    // Если это blob URL, освобождаем память
    if (photo.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
    
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;

    setPhotos(prev => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || photos.length >= 5) return;

    const isValid = /^(https?:\/\/|\/)/.test(trimmed) ||
        /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed);

    if (!isValid) {
      alert("Пожалуйста, введите корректный URL изображения");
      return;
    }

    setPhotos(prev => [...prev, {
      url: trimmed,
      isNew: true
    }]);
    setNewUrl("");
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z0-9\-]/g, '');
    value = value.toLowerCase();
    e.target.value = value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !id) return;
    if (submittingRef.current) return;

    const slugInput = formRef.current?.querySelector('[name="slug"]') as HTMLInputElement;
    if (slugInput && !slugInput.value.trim()) {
      return;
    }

    const formData = new FormData(formRef.current!);

    // Добавляем информацию о фотографиях
    const photoData = {
      existing: photos
        .filter(p => !p.isNew && p.id)
        .map(p => ({ id: p.id, url: p.url })),
      new: photos
        .filter(p => p.isNew && p.file)
        .map((p, index) => ({ fileIndex: index, url: p.url }))
    };

    // Добавляем новые файлы в FormData
    photos.forEach((photo, index) => {
      if (photo.isNew && photo.file) {
        formData.append('photos', photo.file);
      }
    });

    // Добавляем JSON с информацией о фотографиях
    formData.append('photoData', JSON.stringify(photoData));

    // Добавляем образование
    formData.append("education", JSON.stringify(educationData));

    console.log("📤 Отправка формы редактирования...");
    console.log("📸 Фотографий:", photos.length);
    console.log("📚 Образование:", educationData);
    console.log("ID пользователя:", id);

    try {
      submittingRef.current = true;
      await updatePsychologist(id, formData);
      router.push("/admin/psychologists?success=updated");
    } catch (error) {
      submittingRef.current = false;
      console.error("Ошибка при обновлении:", error);
    }
  };

  const handleEducationUpdate = (updatedEducation: any[]) => {
    setEducationData(updatedEducation);
  };

  // Очистка blob URL
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5858E2]"></div>
            </div>
            <h1 className="mt-4 text-center font-display text-xl font-bold text-gray-900">
              Загружаем данные пользователя...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Пользователь не найден
            </h1>
            <div className="mt-6">
              <Link
                href="/admin/psychologists"
                className="rounded-xl bg-[#5858E2] px-6 py-3 font-medium text-white hover:bg-[#4848d0]"
              >
                Вернуться к списку
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">
            Редактировать: {user.fullName || 'Без имени'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            ID: {user.id} | Создано: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-800">
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* Основная информация */}
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
                    defaultValue={user.fullName || ''}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
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
                      required
                      defaultValue={user.slug || ''}
                      onChange={handleSlugChange}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={user.city || ""}
                    placeholder="Москва, Санкт-Петербург..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                  <select
                    name="gender"
                    defaultValue={user.gender || ''}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  >
                    <option value="">Не указан</option>
                    <option value="М">Мужской</option>
                    <option value="Ж">Женский</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата рождения
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    defaultValue={user.birthDate?.split('T')[0] || ''}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>
              </div>

              {/* Статус */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  name="status"
                  defaultValue={user.status}
                  className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                >
                  <option value="PENDING">Ожидает подтверждения email</option>
                  <option value="CANDIDATE">Кандидат</option>
                  <option value="ACTIVE">В каталоге</option>
                  <option value="REJECTED">Отклонён</option>
                  <option value="BLOCKED">Заблокирован</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Изменение статуса влияет на отображение в каталоге и доступ к функциям
                </p>
              </div>
            </div>

            {/* Профессиональная информация */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Профессиональная информация</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Формат работы</label>
                {referencesLoading ? (
                  <div className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 bg-gray-100 animate-pulse">
                    Загрузка форматов работы...
                  </div>
                ) : (
                  <select
                    name="workFormat"
                    defaultValue={user.workFormat || ''}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  >
                    <option value="">Выберите формат работы</option>
                    {workFormats.map((format, index) => (
                      <option key={index} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата первого диплома
                  </label>
                  <input
                    type="date"
                    name="firstDiplomaDate"
                    defaultValue={user.firstDiplomaDate?.split('T')[0] || ""}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата последней сертификации
                  </label>
                  <input
                    type="date"
                    name="lastCertificationDate"
                    defaultValue={user.lastCertificationDate?.split('T')[0] || ""}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>
              </div>

              {/* Парадигмы */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Парадигмы
                </label>
                <ParadigmSelector
                  defaultValue={user.mainParadigm || []}
                />
              </div>

              {/* Уровень сертификации */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень сертификации
                </label>
                {referencesLoading ? (
                  <div className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-3 bg-gray-100 animate-pulse">
                    Загрузка уровней...
                  </div>
                ) : (
                  <select
                    name="certificationLevel"
                    defaultValue={user.certificationLevel || 0}
                    className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  >
                    <option value={0}>Без уровня</option>
                    {certificationLevels.map((level, index) => (
                      <option key={index} value={parseInt(level)}>
                        Уровень {level}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* О психологе */}
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
                  defaultValue={user.shortBio || ""}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  О себе подробно
                </label>
                <textarea
                  name="longBio"
                  rows={6}
                  defaultValue={user.longBio || ""}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                />
              </div>
            </div>

            {/* Контакты и стоимость */}
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
                    defaultValue={user.price || 0}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Контакты
                  </label>
                  <textarea
                    name="contactInfo"
                    rows={3}
                    defaultValue={user.contactInfo || ""}
                    placeholder="Телефон, Email, Telegram..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>
              </div>
            </div>

            {/* Фотографии - обновленная секция */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Фотографии</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фото психолога (основное + до 4 дополнительных)
                </label>

                {/* Загрузка файлов */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 file:mr-4 file:rounded-lg file:border-0 file:bg-[#5858E2] file:px-4 file:py-2 file:text-white hover:file:bg-[#4848d0]"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Можно выбрать несколько файлов. Максимум 5 фотографий.
                  </p>
                </div>

                {/* Добавление URL */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                      placeholder="https://example.com/photo.jpg или /uploads/filename.jpg"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                    />
                    <button
                      type="button"
                      onClick={addUrl}
                      disabled={!newUrl.trim() || photos.length >= 5}
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                    >
                      Добавить URL
                    </button>
                  </div>
                </div>

                {/* Список фотографий */}
                {photos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Выбранные фотографии ({photos.length}/5):
                    </p>
                    <p className="mb-2 text-xs text-gray-500">Используйте ↑ ↓ для изменения порядка.</p>
                    <div className="space-y-2">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded border border-gray-300 overflow-hidden bg-white">
                              <img
                                src={photo.url}
                                alt={`Фото ${index + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="Arial" font-size="8" fill="%239ca3af" text-anchor="middle" dy=".3em">IMG</text></svg>';
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {photo.file?.name || `Фото ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {photo.isNew ? 'Новый файл' : 'Существующее'}
                                {index === 0 && ' • Основное'}
                                {photo.id && ` • ID: ${photo.id}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => movePhoto(index, -1)}
                              disabled={index === 0}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                              title="Переместить выше"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhoto(index, 1)}
                              disabled={index === photos.length - 1}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                              title="Переместить ниже"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
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

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Важно:</span> Фотографии сохраняются как документы с типом PHOTO.
                    Первое фото в списке будет основным.
                  </p>
                </div>
              </div>
            </div>

            {/* Образование */}
            <div>
              <EducationFormEdit
                initialData={educationData}
                onEducationUpdate={handleEducationUpdate}
              />
            </div>

            {/* Публикация */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                defaultChecked={user.isPublished || false}
                className="h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
                Показывать на сайте
              </label>
            </div>

            {/* Кнопки */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="rounded-xl bg-[#5858E2] px-8 py-3 font-medium text-white hover:bg-[#4848d0] shadow-md hover:shadow-lg transition-all"
              >
                Сохранить изменения
              </button>
              <Link
                href="/admin/psychologists"
                className="rounded-xl border border-gray-300 px-8 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPsychologistForm;