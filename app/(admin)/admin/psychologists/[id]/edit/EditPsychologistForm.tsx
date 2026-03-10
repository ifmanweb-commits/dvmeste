"use client";

import Link from "next/link";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  updatePsychologist, 
  getPsychologistById, 
  deleteDocumentAsAdmin,
  togglePsychologistPublish
} from "@/lib/actions/admin-psychologists";
import { ParadigmSelector } from "@/components/admin/ParadigmSelector";
import { formatDateForInput } from "@/lib/utils"; // Ваша новая функция-хелпер
import { 
  User, 
  Mail, 
  MapPin, 
  CreditCard, 
  Globe, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  ArrowLeft,
  Users,
  Info,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2, XCircle, Loader2
} from "lucide-react";

function EditPsychologistForm() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paradigms, setParadigms] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  // Таймер для скрытия сообщения
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  useEffect(() => {
    async function loadData() {
      const data = await getPsychologistById(id);
      if (data) {
        setUser(data);
        setParadigms(data.mainParadigm || []);
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

  // Стили для инпутов с учетом черновика
  const inputClasses = (fieldName: string) => `
    w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-all outline-none
    ${hasDraft(fieldName) 
      ? 'border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10' 
      : 'border-gray-300 focus:border-[#5858E2] focus:ring-4 focus:ring-[#5858E2]/10'}
  `;

  return (
    <div className="min-h-screen  pb-20">
    {/* Шапка формы */}
    <div className="max-w-5xl mx-auto px-6 sticky top-22 z-30 bg-white py-4 border-b">
      <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2">
        
        {/* ЛЕВАЯ ЧАСТЬ: Назад и Инфо */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 truncate">
              {user.fullName || "Имя не указано"}
            </h1>
            <p className="text-[11px] text-gray-500">
              Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}<br></br>
              {user.id}
            </p>
          </div>
        </div>

        {/* СРЕДНЯЯ ЧАСТЬ: Сообщения системы */}
        <div className="flex justify-center items-center">
          {message && (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold animate-in fade-in zoom-in duration-300 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {message.text}
            </div>
          )}

          {isSaving && !message && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#5858E2] animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Сохранение данных...
            </div>
          )}
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Кнопка сохранения (Sticky) */}
        <div className="flex justify-end shrink-0">
          <button
            type="submit"
            form="psychologist-edit-form"
            disabled={isSaving}
            title="Сохранить"
            className="px-2 py-2 bg-[#5858E2] text-white text-sm font-bold rounded-xl
              hover:bg-[#4848d0] transition-all disabled:opacity-50 shadow-md shadow-[#5858E2]/20
              flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form 
          key={lastUpdated} // Магия для обновления defaultValue
          action={handleAction} 
          className="space-y-8"
          id="psychologist-edit-form"
        >
          <input type="hidden" name="id" value={user.id} />
          
          {/* СЕКЦИЯ 1: Основные данные */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Основная информация
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">ФИО <DraftIndicator fieldName="fullName" /></label>
                <input name="fullName" defaultValue={user.fullName || ""} className={inputClasses("fullName")} />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Email <DraftIndicator fieldName="email" /></label>
                <input name="email" defaultValue={user.email || ""} className={inputClasses("email")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Цена (₽) <DraftIndicator fieldName="price" /></label>
                <input type="number" name="price" defaultValue={user.price || ""} className={inputClasses("price")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Город <DraftIndicator fieldName="city" /></label>
                <input name="city" defaultValue={user.city || ""} className={inputClasses("city")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Пол <DraftIndicator fieldName="gender" /></label>
                <select name="gender" defaultValue={user.gender || ""} className={inputClasses("gender")}>
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Дата рождения <DraftIndicator fieldName="birthDate" /></label>
                <input type="date" name="birthDate" defaultValue={formatDateForInput(user.birthDate)} className={inputClasses("birthDate")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Формат работы <DraftIndicator fieldName="workFormat" /></label>
                <select name="workFormat" defaultValue={user.workFormat || ""} className={inputClasses("workFormat")}>
                  <option value="ONLINE">Онлайн</option>
                  <option value="OFFLINE">Оффлайн</option>
                  <option value="BOTH">Оба формата</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Контакты <DraftIndicator fieldName="contactInfo" /></label>
                <textarea name="contactInfo" rows={2} defaultValue={user.contactInfo || ""} className={inputClasses("contactInfo")} />
              </div>
            </div>
          </section>

          {/* СЕКЦИЯ 2: Системные данные */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Системные данные
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Slug (URL профиля)</label>
                <input name="slug" defaultValue={user.slug || ""} className={inputClasses("slug")} />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Статус</label>
                <select name="status" defaultValue={user.status} className={inputClasses("status")}>
                  <option value="PENDING">Ожидает подтверждения email</option>
                  <option value="CANDIDATE">Кандидат</option>
                  <option value="ACTIVE">Участник</option>
                  <option value="REJECTED">Отклонен</option>
                  <option value="BLOCKED">Заблокирован</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Уровень сертификации</label>
                <select name="certificationLevel" defaultValue={user.certificationLevel || 1} className={inputClasses("certificationLevel")}>
                  <option value={1}>Уровень 1</option>
                  <option value={2}>Уровень 2</option>
                  <option value={3}>Уровень 3</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Дата последней сертификации</label>
                <input type="date" name="lastCertificationDate" defaultValue={formatDateForInput(user.lastCertificationDate)} className={inputClasses("lastCertificationDate")} />
              </div>
            </div>
          </section>

          {/* СЕКЦИЯ 3: Контент и анкета */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" /> Парадигмы и анкета
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Парадигмы <DraftIndicator fieldName="mainParadigm" /></label>
                <ParadigmSelector 
                  defaultValue={paradigms} // используем defaultValue
                  onChange={setParadigms} 
                />
                <input type="hidden" name="mainParadigm" value={JSON.stringify(paradigms)} />
              </div>

              <div className="w-1/2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">Дата первого диплома <DraftIndicator fieldName="firstDiplomaDate" /></label>
                <input type="date" name="firstDiplomaDate" defaultValue={formatDateForInput(user.firstDiplomaDate)} className={inputClasses("firstDiplomaDate")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">О себе кратко <DraftIndicator fieldName="shortBio" /></label>
                <textarea name="shortBio" rows={3} defaultValue={user.shortBio || ""} className={inputClasses("shortBio")} />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">О себе подробно <DraftIndicator fieldName="longBio" /></label>
                <textarea name="longBio" rows={10} defaultValue={user.longBio || ""} className={inputClasses("longBio")} />
              </div>
            </div>
          </section>

          {/* СЕКЦИЯ 4: Фотографии */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" /> Фото профиля
              </h2>
              {hasDraft('photos') && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Есть новые в черновике</span>}
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
                  <p className="col-span-full text-sm text-gray-400 py-4 italic">Нет загруженных фотографий</p>
                )}
              </div>
            </div>
          </section>

          {/* Финальные действия */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors">
          {/* Оборачиваем всё в label, чтобы вся область была кликабельной */}
          <label className="flex items-center cursor-pointer w-full justify-between">
            <div className="flex items-center">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={user.isPublished}
                  onChange={handleTogglePublish}
                  className="sr-only peer"
                />
                {/* Визуальный слайдер */}
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5858E2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5858E2]"></div>
                
                <span className="ml-3 text-sm font-semibold text-gray-700">
                  Показывать на сайте
                </span>
              </div>
            </div>
            
            {/* Статус-бейдж */}
            {user.isPublished ? (
              <span className="ml-3 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                Сейчас опубликован
              </span>
            ) : (
              <span className="ml-3 text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                Сейчас черновик
              </span>
            )}
          </label>
        </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-10 py-3 rounded-xl bg-[#5858E2] text-sm font-bold text-white hover:bg-[#4848d0] shadow-lg shadow-[#5858E2]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPsychologistForm;