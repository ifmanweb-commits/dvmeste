// components/account/ProfileFormContainer.tsx
'use client'

import { useState, useRef } from 'react'
import { User, Document, DocumentType } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Lock, User as UserIcon, FileText, ClipboardList, Plus, Camera, Trash2, Star, Check } from 'lucide-react'
import { LockedFeature } from './LockedFeature'
import { Input, Select } from "@/components/ui/ProfileFields"
import { ParadigmSelector } from "@/components/ui/ParadigmSelector"
import { DocumentsTab } from "@/components/account/tabs/DocumentsTab"
import { updateBasicProfile, updateDetailedProfileDraft, registerUploadedDocument,
  deletePhoto, setMainPhoto, updateDocumentMetadata, deleteDocument } from "@/app/account/profile/actions"



type Tab = 'basic' | 'detailed' | 'photos' | 'docs'
const PARADIGM_OPTIONS = [
  "КПТ", "Психоанализ", "Гештальт-терапия", "Экзистенциальная терапия", 
  "АСТ", "DBT", "ЭФТ", "Клиент-центрированная терапия", "Системная семейная терапия"
]
type UserWithDocuments = User & {
  documents: Document[]
}



export function ProfileFormContainer({ user: initialUser }: { user: UserWithDocuments }) {
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const isCandidate = initialUser.status === 'CANDIDATE' || initialUser.status === 'PENDING'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState(initialUser)

  // Вспомогательная функция для вывода сообщений с авто-скрытием
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000); // Скрыть через 5 сек
  };
  // Сохранение первой вкладки (Личные данные)
  const handleSaveBasic = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await updateBasicProfile(formData);
      if (result.success) {
        showMessage('success', "Личные данные успешно обновлены");
      } else {
        showMessage('error', result.error || "Не удалось обновить данные");
      }
    } catch (e) {
      showMessage('error', "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  // Сохранение второй вкладки (Черновик)
  const handleSaveDetailed = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const result = await updateDetailedProfileDraft(formData);
      if (result.success) {
        showMessage('success', "Черновик сохранен и отправлен на модерацию");
      } else {
        showMessage('error', result.error || "Не удалось сохранить черновик");
      }
    } catch (e) {
      showMessage('error', "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  

  // Фильтруем фото из общего списка документов
  const photos = user.documents.filter(d => d.type === 'PHOTO');
  // Обработчик загрузки фото
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Нельзя загружать больше 5 фото
    if (photos.length >= 5) {
      showMessage('error', "Вы уже загрузили 5 фотографий. Удалите лишние, чтобы добавить новую.");
      e.target.value = '';
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', 'users-photos');
    formData.append('entityKey', user.id);

    try {
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const data = await res.json();
      console.log("Response from server:", data);

      // В твоем route.ts успешный ответ содержит объект data.file 
      // с полями name, url, size
      if (data.success && data.file) {
        const dbRes = await registerUploadedDocument({
            url: data.file.url,
            name: data.file.name,
            size: data.file.size,
            type: 'PHOTO'
          });
        
        if (dbRes.success) {
          showMessage('success', "Фото отправлено на модерацию");
        } else {
          showMessage('error', dbRes.error || "Ошибка сохранения");
        }
      }
    } catch (err) {
      showMessage('error', "Ошибка загрузки");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Обработчик удаления фото
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Удалить эту фотографию?")) return;
    
    setLoading(true);
    const res = await deletePhoto(photoId);
    if (res.success) {
      showMessage('success', "Фотография удалена");
    } else {
      const er = res.error ?? "";
      showMessage('error', er);
    }
    setLoading(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;

    try {
      const res = await deleteDocument(id);
      
      if (res.success) {
        // ВОТ ЭТОТ КУСОК ОБНОВЛЯЕТ ИНТЕРФЕЙС МГНОВЕННО:
        setUser(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== id)
        }));
        
        console.log("Документ успешно удален из базы и стейта");
      } else {
        alert(res.error || "Не удалось удалить документ");
      }
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert("Произошла ошибка при удалении файла");
    }
  };

  // Сделать фото главным
  const handleSetMain = async (photoId: string) => {
    setLoading(true);
    const res = await setMainPhoto(photoId);
    if (res.success) {
      showMessage('success', "Главное фото изменено");
    } else {
      showMessage('error', res.error ?? 'Ошибка');
    }
    setLoading(false);
  };

const handleDocUpload = async (file: File, type: DocumentType) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', 'users-docs');
    formData.append('entityKey', user.id);
    formData.append('type', String(type));

    try {
      const res = await fetch('/api/files', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();

      if (data.success && data.file) {
        // Регистрируем документ в БД через серверный экшен
        const regRes = await registerUploadedDocument({
          url: data.file.url,
          name: data.file.name,
          size: data.file.size,
          type: type 
        });

        if (regRes.success && regRes.document) {
          // ВАЖНО: Обновляем состояние, чтобы документ сразу появился в интерфейсе
          setUser(prev => ({
            ...prev,
            documents: [...prev.documents, regRes.document as Document]
          }));
          
          console.log("Документ успешно загружен и зарегистрирован");
        } else {
          alert(regRes.error || "Ошибка при регистрации документа в базе данных");
        }
      } else {
        alert(data.error || "Ошибка при физической загрузке файла на сервер");
      }
    } catch (err) {
      console.error("Критическая ошибка загрузки:", err);
      alert("Произошла ошибка сети при попытке загрузить файл");
    } finally {
      setLoading(false);
    }
  };

  // 2. Обновление текста (Вуз, Год)
  
const handleUpdateDocData = async (docId: string, data: any) => {
    // 1. МГНОВЕННО обновляем локальное состояние. 
    // Это заставит буквы появиться в инпуте сразу, без ожидания сервера.
    setUser(prev => ({
      ...prev,
      documents: prev.documents.map(d => 
        d.id === docId ? { ...d, ...data } : d
      )
    }));

    // 2. Очищаем старый таймер дебаунса
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 3. Ставим новый таймер на 1 секунду
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await updateDocumentMetadata(docId, data);
        
        if (!res.success) {
          // Если сервер вернул ошибку, здесь можно вывести алерт
          console.error(res.error ?? "Ошибка сохранения данных документа");
        } else {
          console.log("Данные документа сохранены в БД");
        }
      } catch (err) {
        console.error("Ошибка сети при сохранении документа:", err);
      }
    }, 1000);
  };


  // Инициализируем состояние данными пользователя из Prisma
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    city: user.city || '',
    price: user.price || 0,
    gender: user.gender || '',
    birthDate: user.birthDate,
    workFormat: user.workFormat || '',
    contactInfo: user.contactInfo || '',
    // Поля для будущих вкладок
    firstDiplomaDate: user.firstDiplomaDate, // Вот это поле вызывало ошибку
    shortBio: user.shortBio || '',
    longBio: user.longBio || '',
    mainParadigm: user.mainParadigm || [],
  })
  const tabs = [
    { id: 'basic', label: 'Личные данные', icon: UserIcon, locked: false },
    { id: 'detailed', label: 'Подробная информация', icon: FileText, locked: isCandidate },
    { id: 'photos', label: 'Фотографии', icon: Camera, locked: isCandidate },
    { id: 'docs', label: 'Документы', icon: ClipboardList, locked: isCandidate },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Навигация */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center px-6 py-4 text-sm font-medium transition-all relative",
              activeTab === tab.id 
                ? "text-blue-600 bg-white" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4 mr-2", tab.locked && "text-gray-400")} />
            {tab.label}
            {tab.locked && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Вкладка 1: Личные данные (Всегда доступна) */}
        <div className={cn(activeTab !== 'basic' && "hidden")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Имя и фамилия" 
              value={formData.fullName || ''} 
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
            
            <Input 
              label="Город" 
              value={formData.city || ''} 
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />

            <Input 
              label="Цена приема (₽)" 
              type="number"
              value={formData.price || ''} 
              onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
            />

            <Select 
              label="Пол" 
              value={formData.gender || ''}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">Не указано</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </Select>

            <Input 
              label="Дата рождения" 
              type="date"
              value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''} 
              onChange={(e) => setFormData({...formData, birthDate: new Date(e.target.value)})}
            />

            <Select 
              label="Формат работы" 
              value={formData.workFormat || ''}
              onChange={(e) => setFormData({...formData, workFormat: e.target.value})}
            >
              <option value="ONLINE">Онлайн</option>
              <option value="OFFLINE">Оффлайн</option>
              <option value="BOTH">И то, и другое</option>
            </Select>

            <div className="md:col-span-2">
              <Input 
                label="Контакты (Telegram, WhatsApp)" 
                placeholder="@username или ссылка"
                maxLength={50}
                value={formData.contactInfo || ''} 
                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                error={formData.contactInfo && formData.contactInfo.length > 50 ? "Максимум 50 символов" : ""}
              />
            </div>
          </div>
          {message && (
            <div className={cn(
              "p-4 rounded-lg mb-6 text-sm",
              message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {message.text}
            </div>
          )}
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSaveBasic} // или handleSaveDetailed
              disabled={loading}
              className={cn(
                "bg-[#5858E2] text-white px-8 py-2 rounded-lg transition-colors",
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#4747b5]"
              )}
            >
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </div>

        {/* Вкладка 2: Подробно */}
        <div className={cn(activeTab !== 'detailed' && "hidden")}>
          {isCandidate ? (
            <LockedFeature 
              title="Раздел закрыт" 
              description="Подробная анкета, парадигмы и био доступны только участникам каталога." 
            />
          ) : (
            <div className="space-y-8">
              {/* Парадигмы */}
              <ParadigmSelector 
                label="Ваши рабочие парадигмы"
                options={PARADIGM_OPTIONS}
                selected={formData.mainParadigm}
                onChange={(items) => setFormData({...formData, mainParadigm: items})}
              />

              {/* Дата диплома */}
              <div className="max-w-xs">
                <Input 
                  label="Дата получения первого диплома" 
                  type="date"
                  value={formData.firstDiplomaDate ? new Date(formData.firstDiplomaDate).toISOString().split('T')[0] : ''} 
                  onChange={(e) => setFormData({...formData, firstDiplomaDate: new Date(e.target.value)})}
                />
              </div>

              {/* Краткое био */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  О себе кратко (для карточки в каталоге)
                </label>
                <textarea 
                  maxLength={400}
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.shortBio || ''}
                  onChange={(e) => setFormData({...formData, shortBio: e.target.value})}
                />
                <div className="text-right text-xs text-gray-400">
                  {formData.shortBio?.length || 0} / 400
                </div>
              </div>

              {/* Подробное био */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Подробное описание опыта и методов
                </label>
                <textarea 
                  rows={10}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.longBio || ''}
                  onChange={(e) => setFormData({...formData, longBio: e.target.value})}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  💡 Эти данные сохраняются как <strong>черновик</strong>. Они будут опубликованы в каталоге только после того, как вы нажмете «Отправить на модерацию» и менеджер подтвердит изменения.
                </p>
              </div>
              {message && (
                <div className={cn(
                  "p-4 rounded-lg mb-6 text-sm",
                  message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  {message.text}
                </div>
              )}
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveDetailed} // или handleSaveDetailed
                  disabled={loading}
                  className={cn(
                    "bg-[#5858E2] text-white px-8 py-2 rounded-lg transition-colors",
                    loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#4747b5]"
                  )}
                >
                  {loading ? "Сохранение..." : "Сохранить черновик"}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Вкладка 3: Фото */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Отрисовка существующих фото */}
              {photos.map((photo) => {
                const isMain = user.avatarUrl === photo.url;
                
                return (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50">
                    <img src={photo.url} className="w-full h-full object-cover" alt="Профиль" />
                    
                    {/* Метка главного фото */}
                    {isMain && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-[10px] text-white px-2 py-1 rounded shadow-md z-10 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        ГЛАВНОЕ
                      </div>
                    )}

                    {/* Оверлей управления (появляется при наведении) */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!isMain && (
                        <button
                          onClick={() => handleSetMain(photo.id)}
                          className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
                          title="Сделать главной"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Индикатор модерации */}
                    {!photo.verifiedAt && (
                      <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-white text-[9px] py-1 text-center font-bold uppercase tracking-wider">
                        На проверке
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Слоты для загрузки (если меньше 5) */}
              {photos.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Plus className="w-8 h-8 text-gray-300" />
                  <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase">Загрузить</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={loading} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Вкладка 4: Документы */}
        <div className={cn(activeTab !== 'docs' && "hidden")}>
          {isCandidate ? (
            <LockedFeature 
              title="Документы недоступны" 
              description="Вы сможете загрузить дипломы и сертификаты в процессе подачи заявки на сертификацию. Сейчас они не требуются." 
            />
          ) : (
            // Убираем лишнее условие activeTab === 'docs', так как оно уже проверено в className выше
            <DocumentsTab 
              documents={user.documents}
              loading={loading}
              onUpload={handleDocUpload as any} 
              onDelete={handleDeleteDoc}
              onUpdateMetadata={handleUpdateDocData}
            />
          )}
        </div>
      </div>
    </div>
  )
}