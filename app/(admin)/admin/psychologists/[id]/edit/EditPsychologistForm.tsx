"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  updatePsychologist, 
  getPsychologistById, 
  deleteDocumentAsAdmin,
  togglePsychologistPublish,
  getPsychologistAwards,
  revokePsychologistAward
} from "@/lib/actions/admin-psychologists";
import { getAllCoursesForSelect } from "@/lib/actions/courses";
import { CoursesBlock } from "@/components/admin/CoursesBlock";
import { ParadigmSelector } from "@/components/admin/ParadigmSelector";
import { formatDateForInput } from "@/lib/utils";
import { 
  User, 
  Globe, 
  ShieldCheck, 
  AlertCircle,
  Info,
  Save,
  Trash2,
  CheckCircle2,
  Loader2
} from "lucide-react";

function EditPsychologistForm() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paradigms, setParadigms] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [awards, setAwards] = useState<any[]>([]);
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; awardId: string; awardName: string }>({ open: false, awardId: '', awardName: '' });
  const [isRevoking, setIsRevoking] = useState(false);
  // Таймер для скрытия сообщения
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  useEffect(() => {
    async function loadData() {
      const [data, allCourses, awardsData] = await Promise.all([
        getPsychologistById(id),
        getAllCoursesForSelect(),
        getPsychologistAwards(id),
      ]);
      if (data) {
        setUser(data);
        setParadigms(data.mainParadigm || []);
        setCourses(allCourses);
        setAwards(awardsData);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка данных психолога...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Психолог не найден</div>;
  // Обертка для экшена (решает проблему типизации void)
  async function handleAction(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    try {
      formData.set("mainParadigm", JSON.stringify(paradigms));

      await updatePsychologist(formData);
      
      const freshData = await getPsychologistById(id);
      if (freshData) {
        setUser(freshData);
        setParadigms(freshData.mainParadigm || []);
        // 3. Меняем ключ, чтобы форсировать перерисовку инпутов
        setLastUpdated(Date.now());
      }

      setMessage({ type: 'success', text: 'Данные успешно обновлены' });
      // Не делаем setLoading(true), так как Next.js обновит пропсы/данные через revalidate
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка при сохранении данных' });
    } finally {
      setIsSaving(false);
    }
  }
  // Логика проверки наличия черновика для конкретного поля
  const hasDraft = (fieldName: string) => {
    // 1. Проверяем, есть ли вообще данные в черновике
    const draft = user?.draftData as any;
    if (!draft || typeof draft !== 'object') return false;

    // 2. Проверяем наличие ключа
    const hasKey = fieldName in draft;
    if (!hasKey) return false;

    // 3. (Опционально) Сравниваем значения. 
    // Если в черновике то же самое, что и в базе — подсвечивать не обязательно.
    const currentValue = user[fieldName];
    const draftValue = draft[fieldName];
    
    // Для массивов (парадигм) используем JSON.stringify для сравнения
    if (Array.isArray(draftValue)) {
      return JSON.stringify(currentValue) !== JSON.stringify(draftValue);
    }

    return currentValue !== draftValue;
  };

  const handleTogglePublish = async () => {
    const newStatus = !user.isPublished;
    
    // 1. Оптимистично обновляем UI
    setUser((prev: any) => ({ ...prev, isPublished: newStatus }));

    try {
      const result = await togglePsychologistPublish(id, newStatus);
      if (!result) {
        throw new Error("Ошибка сервера");
      }
      setMessage({ 
        type: 'success', 
        text: newStatus ? 'Профиль опубликован' : 'Профиль скрыт с сайта' 
      });
    } catch (error) {
      // Если произошла ошибка, откатываем состояние назад
      setUser((prev: any) => ({ ...prev, isPublished: !newStatus }));
      setMessage({ type: 'error', text: 'Не удалось изменить статус' });
    }
  };

  // Компонент метки черновика
  const DraftIndicator = ({ fieldName }: { fieldName: string }) => {
    if (!hasDraft(fieldName)) return null;

    const draftValue = (user.draftData as any)[fieldName];
    
    const truncate = (txt: any, limit: number) => {
      if (typeof txt !== 'string') return txt;
      return txt.length > limit ? txt.substring(0, limit) + "..." : txt;
    };

    let tooltipContent = "";
    if (Array.isArray(draftValue)) {
      tooltipContent = truncate(draftValue.join(", "), 100);
    } else if (typeof draftValue === 'boolean') {
      tooltipContent = draftValue ? "Да" : "Нет";
    } else {
      tooltipContent = truncate(String(draftValue), 150);
    }

    return (
      <div className="group relative ml-2 inline-flex items-center">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-[10px] font-bold text-amber-700 uppercase tracking-wider animate-pulse cursor-help">
          <AlertCircle className="w-3 h-3" />
          Черновик
        </div>
        
        {/* Тултип: теперь вылетает справа (left-full) */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-[100] pointer-events-none">
          <p className="font-semibold border-b border-gray-700 pb-1 mb-2 text-amber-400">
            Предложение пользователя:
          </p>
          <p className="leading-relaxed italic max-h-40 overflow-y-auto custom-scrollbar">
            {tooltipContent || "Пустое значение"}
          </p>
          
          {/* Хвостик тултипа (теперь слева от него) */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    );
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Удалить это фото навсегда?")) return;

    const result = await deleteDocumentAsAdmin(photoId, id);
    
    if (result.success) {
      // Обновляем локальный стейт, чтобы фото исчезло мгновенно
      setUser((prev: any) => ({
        ...prev,
        documents: prev.documents.filter((d: any) => d.id !== photoId)
      }));
    } else {
      alert(result.error || "Ошибка при удалении");
    }
  };

  const handleRevokeAward = async () => {
    if (!revokeModal.awardId) return;
    setIsRevoking(true);
    try {
      const result = await revokePsychologistAward(revokeModal.awardId);
      if (result.success) {
        setAwards(prev => prev.filter(a => a.id !== revokeModal.awardId));
        setMessage({ type: 'success', text: 'Награда отозвана' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка при отзыве награды' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка при отзыве награды' });
    } finally {
      setIsRevoking(false);
      setRevokeModal({ open: false, awardId: '', awardName: '' });
    }
  };

  // Стили для инпутов с учетом черновика
  const inputClasses = (fieldName: string) => `
    w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-all outline-none
    ${hasDraft(fieldName) 
      ? 'border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10' 
      : 'border-gray-300 focus:border-[#5858E2] focus:ring-4 focus:ring-[#5858E2]/10'}
  `;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Шапка с заголовком и кнопкой назад */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Редактирование психолога
          </h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            type="button"
          >
            ← Назад к списку
          </button>
        </div>

        <form 
          key={lastUpdated}
          action={handleAction} 
          className="space-y-6"
          id="psychologist-edit-form"
        >
          <input type="hidden" name="id" value={user.id} />
          
          {/* СЕКЦИЯ 1: Основная информация */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Основная информация
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия <DraftIndicator fieldName="lastName" />
                </label>
                <input 
                  name="lastName" 
                  defaultValue={user.lastName || user.fullName?.split(' ')[1] || ""} 
                  className={inputClasses("lastName")} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя <DraftIndicator fieldName="firstName" />
                </label>
                <input 
                  name="firstName" 
                  defaultValue={user.firstName || user.fullName?.split(' ')[0] || ""} 
                  className={inputClasses("firstName")} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отчество (опционально) <DraftIndicator fieldName="middleName" />
                </label>
                <input 
                  name="middleName" 
                  defaultValue={user.middleName || ""} 
                  className={inputClasses("middleName")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <DraftIndicator fieldName="email" />
                </label>
                <input 
                  name="email" 
                  defaultValue={user.email || ""} 
                  className={inputClasses("email")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Город <DraftIndicator fieldName="city" />
                </label>
                <input 
                  name="city" 
                  defaultValue={user.city || ""} 
                  className={inputClasses("city")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена (₽) <DraftIndicator fieldName="price" />
                </label>
                <input 
                  type="number" 
                  name="price" 
                  defaultValue={user.price || ""} 
                  className={inputClasses("price")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Бесплатных консультаций <DraftIndicator fieldName="freeSession" />
                </label>
                <input 
                  type="number" 
                  name="freeSession" 
                  defaultValue={user.freeSession ?? 0} 
                  min={0}
                  max={10}
                  className={inputClasses("freeSession")} 
                />
                <p className="text-xs text-gray-500 mt-1">От 0 до 10</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата рождения <DraftIndicator fieldName="birthDate" />
                </label>
                <input 
                  type="date" 
                  name="birthDate" 
                  defaultValue={formatDateForInput(user.birthDate)} 
                  className={inputClasses("birthDate")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пол <DraftIndicator fieldName="gender" />
                </label>
                <select 
                  name="gender" 
                  defaultValue={user.gender || ""} 
                  className={inputClasses("gender")} 
                >
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Формат работы <DraftIndicator fieldName="workFormat" />
                </label>
                <select 
                  name="workFormat" 
                  defaultValue={user.workFormat || ""} 
                  className={inputClasses("workFormat")} 
                >
                  <option value="ONLINE">Онлайн</option>
                  <option value="OFFLINE">Оффлайн</option>
                  <option value="BOTH">Оба формата</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Контакты <DraftIndicator fieldName="contactInfo" />
                </label>
                <textarea 
                  name="contactInfo" 
                  rows={2} 
                  defaultValue={user.contactInfo || ""} 
                  className={inputClasses("contactInfo")} 
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                form="psychologist-edit-form"
                disabled={isSaving}
                className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </section>

          {/* СЕКЦИЯ 2: Системные данные */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Системные данные
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL профиля)
                </label>
                <input 
                  name="slug" 
                  defaultValue={user.slug || ""} 
                  className={inputClasses("slug")} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select 
                  name="status" 
                  defaultValue={user.status} 
                  className={inputClasses("status")} 
                >
                  <option value="PENDING">Ожидает подтверждения email</option>
                  <option value="CANDIDATE">Кандидат</option>
                  <option value="ACTIVE">Участник</option>
                  <option value="REJECTED">Отклонен</option>
                  <option value="BLOCKED">Заблокирован</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень сертификации
                </label>
                <select 
                  name="certificationLevel" 
                  defaultValue={user.certificationLevel || 1} 
                  className={inputClasses("certificationLevel")} 
                >
                  <option value={1}>Уровень 1</option>
                  <option value={2}>Уровень 2</option>
                  <option value={3}>Уровень 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата последней сертификации
                </label>
                <input 
                  type="date" 
                  name="lastCertificationDate" 
                  defaultValue={formatDateForInput(user.lastCertificationDate)} 
                  className={inputClasses("lastCertificationDate")} 
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                form="psychologist-edit-form"
                disabled={isSaving}
                className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </section>

          {/* СЕКЦИЯ 3: Парадигмы и анкета */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" /> Парадигмы и анкета
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Парадигмы <DraftIndicator fieldName="mainParadigm" />
                </label>
                <ParadigmSelector 
                  defaultValue={paradigms}
                  onChange={setParadigms} 
                />
                <input type="hidden" name="mainParadigm" value={JSON.stringify(paradigms)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата первого диплома <DraftIndicator fieldName="firstDiplomaDate" />
                </label>
                <input 
                  type="date" 
                  name="firstDiplomaDate" 
                  defaultValue={formatDateForInput(user.firstDiplomaDate)} 
                  className={inputClasses("firstDiplomaDate")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  О себе кратко <DraftIndicator fieldName="shortBio" />
                </label>
                <textarea 
                  name="shortBio" 
                  rows={3} 
                  defaultValue={user.shortBio || ""} 
                  className={inputClasses("shortBio")} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  О себе подробно <DraftIndicator fieldName="longBio" />
                </label>
                <textarea 
                  name="longBio" 
                  rows={10} 
                  defaultValue={user.longBio || ""} 
                  className={inputClasses("longBio")} 
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                form="psychologist-edit-form"
                disabled={isSaving}
                className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </section>

          {/* СЕКЦИЯ 4: Фото профиля */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" /> Фото профиля
              </h2>
              {hasDraft('photos') && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                  Есть новые в черновике
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {user.documents?.filter((d: any) => d.type === 'PHOTO').map((photo: any) => (
                  <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={photo.url} alt="Profile" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Удалить фото"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {user.documents?.filter((d: any) => d.type === 'PHOTO').length === 0 && (
                  <p className="col-span-full text-sm text-gray-400 py-4 italic">
                    Нет загруженных фотографий
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* СЕКЦИЯ 5: Курсы */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Курсы</h2>
            </div>
            <div className="p-6">
              <CoursesBlock 
                psychologistId={user.id}
                courses={courses}
                userCourses={user.courses?.map((uc: any) => ({
                  id: uc.id,
                  courseId: uc.courseId,
                  status: uc.status,
                  course: uc.course,
                })) || []}
              />
            </div>
          </section>

          {/* СЕКЦИЯ 6: Награды */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-400" /> Награды
              </h2>
            </div>
            <div className="p-6">
              {awards.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 italic">Нет наград</p>
              ) : (
                <div className="space-y-3">
                  {awards.map((awardItem) => (
                    <div
                      key={awardItem.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {awardItem.award?.badgeUrl ? (
                          <img
                            src={awardItem.award.badgeUrl}
                            alt={awardItem.award.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#5858E2]/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-[#5858E2]" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {awardItem.award?.name || 'Без названия'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {awardItem.award?.type === 'BADGE' ? 'Ачивка' : 'Сертификат'}
                            {awardItem.certification && ` • ${awardItem.certification.title}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            Выдана: {new Date(awardItem.awardedAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevokeModal({
                          open: true,
                          awardId: awardItem.id,
                          awardName: awardItem.award?.name || 'Награда',
                        })}
                        className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Отозвать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Модалка подтверждения отзыва награды */}
          {revokeModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setRevokeModal({ open: false, awardId: '', awardName: '' })}
              />
              <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Отозвать награду
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Вы уверены, что хотите отозвать награду{' '}
                  <span className="font-medium text-gray-900">«{revokeModal.awardName}»</span>?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setRevokeModal({ open: false, awardId: '', awardName: '' })}
                    disabled={isRevoking}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeAward}
                    disabled={isRevoking}
                    className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRevoking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Отзыв...
                      </>
                    ) : (
                      'Отозвать'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Финальные действия */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {/* Переключатель публикации */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      name="isPublished"
                      checked={user.isPublished}
                      onChange={handleTogglePublish}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5858E2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5858E2]"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Показывать на сайте
                    </span>
                  </div>
                </label>
                {user.isPublished ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded uppercase tracking-wider">
                    Опубликован
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded uppercase tracking-wider">
                    Черновик
                  </span>
                )}
              </div>

              {/* Кнопки действий с сообщением */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                
                <div className="flex items-center gap-3">
                  {message && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                      message.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {message.text}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    form="psychologist-edit-form"
                    disabled={isSaving}
                    className="px-8 py-2.5 rounded-lg bg-[#5858E2] text-sm font-medium text-white hover:bg-[#4a4ac9] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Сохранить изменения
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPsychologistForm;