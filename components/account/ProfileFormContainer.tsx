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

type UserWithDocuments = User & {
  documents: Document[]
}
interface ProfileFormProps {
  user: UserWithDocuments;
  availableParadigms: string[];
}

export function ProfileFormContainer({ 
  user: initialUser, 
  availableParadigms 
}: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const isCandidate = initialUser.status === 'CANDIDATE' || initialUser.status === 'PENDING'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Единый источник правды — состояние user
  // Инициализируем состояние, объединяя основные данные с черновиком из JSON
  const [user, setUser] = useState(() => {
    // Извлекаем черновик из JSON-поля draftData 
    const draft = (initialUser.draftData as any) || {};
    // Правильно читаем данные из draft
    const draftData = draft?.data || {};
    const draftStatus = draft?.status;
    const draftComment = draft?.comment;

    return {
      ...initialUser,
      // Если в черновике есть значение, берем его, иначе — из основного профиля 
      shortBio: draftData.shortBio ?? initialUser.shortBio,
      longBio: draftData.longBio ?? initialUser.longBio,
      mainParadigm: draftData.mainParadigm ?? initialUser.mainParadigm,
      firstDiplomaDate: draftData.firstDiplomaDate ?? initialUser.firstDiplomaDate,
      draftStatus: draftStatus,
      draftComment: draftComment
    };
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Универсальный обработчик для мгновенного обновления и авто-сохранения (Detailed)
  const handleDetailedChange = (field: string, value: any) => {
    // 1. Мгновенно обновляем UI
    const updatedUser = {
      ...user,
      [field]: value
    };
    setUser(updatedUser);

    // 2. Дебаунс для сохранения
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        // Отправляем все поля, которые должны быть в черновике, 
        // чтобы экшен не затер старые данные в JSON
        await updateDetailedProfileDraft({
          shortBio: updatedUser.shortBio,
          longBio: updatedUser.longBio,
          mainParadigm: updatedUser.mainParadigm,
          firstDiplomaDate: updatedUser.firstDiplomaDate,
        });
        console.log(`Данные сохранены в черновик`);
      } catch (err) {
        console.error("Ошибка при сохранении:", err);
      }
    }, 1000);
  };

  // Обработчик для первой вкладки (Basic) — обновляем стейт мгновенно
  const handleBasicChange = (field: string, value: any) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Сохранение первой вкладки (Личные данные) — берем данные из user
  const handleSaveBasic = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    
    try {
      // Отправляем актуальное состояние user
      const result = await updateBasicProfile(user as any);
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

  // Финальная кнопка сохранения черновика
  const handleSaveDetailed = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      // Отправляем актуальное состояние user
      const result = await updateDetailedProfileDraft(user as any);
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

  // Фотографии и документы
  const photos = user.documents.filter(d => d.type === 'PHOTO');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 5) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', 'users-photos');
    formData.append('entityKey', user.id);

    try {
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.file) {
        const dbRes = await registerUploadedDocument({
            url: data.file.url,
            name: data.file.name,
            size: data.file.size,
            type: 'PHOTO'
          });
        
        if (dbRes.success && dbRes.document) {
          setUser(prev => ({
            ...prev,
            documents: [...prev.documents, dbRes.document as Document]
          }));
          showMessage('success', "Фото добавлено");
        }
      }
    } catch (err) {
      showMessage('error', "Ошибка загрузки");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Удалить фото?")) return;
    const res = await deletePhoto(photoId);
    if (res.success) {
      setUser(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== photoId)
      }));
      showMessage('success', "Удалено");
    }
  };

  // Обработчик удаления документов (дипломов, сертификатов)
  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;

    try {
      // Вызываем серверный экшен
      const res = await deleteDocument(id);
      
      if (res.success) {
        // Мгновенно обновляем локальный стейт user, фильтруя список документов
        setUser(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== id)
        }));
        console.log("Документ успешно удален");
      } else {
        alert(res.error || "Не удалось удалить документ");
      }
    } catch (err) {
      console.error("Ошибка при удалении документа:", err);
      alert("Произошла ошибка при удалении файла");
    }
  };

  const handleSetMain = async (photoId: string) => {
    const res = await setMainPhoto(photoId);
    if (res.success) {
      const photo = user.documents.find(d => d.id === photoId);
      setUser(prev => ({ ...prev, avatarUrl: photo?.url || null }));
      showMessage('success', "Главное фото обновлено");
    }
  };

  const handleDocUpload = async (file: File, type: DocumentType) => {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('scope', 'users-docs');
    fd.append('entityKey', user.id);
    fd.append('type', String(type));

    try {
      const res = await fetch('/api/files', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.file) {
        const regRes = await registerUploadedDocument({
          url: data.file.url,
          name: data.file.name,
          size: data.file.size,
          type: type 
        });
        if (regRes.success && regRes.document) {
          setUser(prev => ({
            ...prev,
            documents: [...prev.documents, regRes.document as Document]
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocData = async (docId: string, data: any) => {
    setUser(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === docId ? { ...d, ...data } : d)
    }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      await updateDocumentMetadata(docId, data);
    }, 1000);
  };

  const tabs = [
    { id: 'basic', label: 'Личные данные', icon: UserIcon, locked: false },
    { id: 'detailed', label: 'Подробная информация', icon: FileText, locked: isCandidate },
    { id: 'photos', label: 'Фотографии', icon: Camera, locked: isCandidate },
    { id: 'docs', label: 'Документы', icon: ClipboardList, locked: isCandidate },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center px-6 py-4 text-sm font-medium transition-all relative",
              activeTab === tab.id ? "text-blue-600 bg-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4 mr-2", tab.locked && "text-gray-400")} />
            {tab.label}
            {tab.locked && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Вкладка 1: Личные данные */}
        <div className={cn(activeTab !== 'basic' && "hidden")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Имя и фамилия"
              value={user.fullName || ''}
              onChange={(e) => handleBasicChange('fullName', e.target.value)}
            />
            <Select
              label="Пол"
              value={user.gender || ''}
              onChange={(e) => handleBasicChange('gender', e.target.value)}
            >
              <option value="">Не указано</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </Select>
            <Input
              label="Город"
              value={user.city || ''}
              onChange={(e) => handleBasicChange('city', e.target.value)}
            />
            <Input
              label="Дата рождения"
              type="date"
              value={user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleBasicChange('birthDate', new Date(e.target.value))}
            />
            <Input
              label="Цена приема (₽)"
              type="number"
              value={user.price || ''}
              onChange={(e) => handleBasicChange('price', parseInt(e.target.value) || 0)}
            />
            <Input
              label="Бесплатных сессий"
              type="number"
              min={0}
              max={10}
              value={user.freeSession ?? 0}
              onChange={(e) => handleBasicChange('freeSession', parseInt(e.target.value) || 0)}
            />
            <Select
              label="Формат работы"
              value={user.workFormat || ''}
              onChange={(e) => handleBasicChange('workFormat', e.target.value)}
            >
              <option value="ONLINE">Онлайн</option>
              <option value="OFFLINE">Оффлайн</option>
              <option value="BOTH">И то, и другое</option>
            </Select>
            <div className="md:col-span-2">
              <Input
                label="Контакты (Telegram, WhatsApp)"
                value={user.contactInfo || ''} 
                onChange={(e) => handleBasicChange('contactInfo', e.target.value)}
              />
            </div>
          </div>
          {message && <div className="mt-4 p-3 rounded bg-blue-50 text-blue-700 text-sm">{message.text}</div>}
          <div className="mt-8 flex justify-end">
            <button onClick={handleSaveBasic} disabled={loading} className="bg-blue-600 text-white px-8 py-2 rounded-lg">
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </div>

        {/* Вкладка 2: Подробно */}
        <div className={cn(activeTab !== 'detailed' && "hidden")}>
          {isCandidate ? <LockedFeature title="Раздел закрыт" description="Доступно участникам каталога." /> : (
            <div className="space-y-8">

              {/* Индикатор статуса черновика */}
              {(user as any).draftStatus === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  ⏳ Ваши изменения отправлены на модерацию и ожидают проверки
                </div>
              )}

              {(user as any).draftStatus === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">✋ Изменения отклонены</p>
                  <p className="text-sm text-red-700">{(user as any).draftComment || 'Комментарий отсутствует'}</p>
                  <p className="text-sm text-red-700 mt-2">Вы можете исправить данные и отправить снова</p>
                </div>
              )}

              <ParadigmSelector 
                label="Ваши рабочие методы"
                options={availableParadigms}
                selected={user.mainParadigm || []}
                onChange={(items) => handleDetailedChange('mainParadigm', items)}
              />
              <div className="max-w-xs">
                <Input 
                  label="Дата получения первого диплома" 
                  type="date"
                  value={user.firstDiplomaDate ? new Date(user.firstDiplomaDate).toISOString().split('T')[0] : ''} 
                  onChange={(e) => handleDetailedChange('firstDiplomaDate', e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Короткая информация</label>
                <textarea
                  className="w-full p-3 border rounded-xl min-h-[100px]"
                  value={user.shortBio || ''}
                  onChange={(e) => handleDetailedChange('shortBio', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Подробное описание</label>
                <textarea 
                  rows={10}
                  className="w-full p-3 border rounded-lg"
                  value={user.longBio || ''}
                  onChange={(e) => handleDetailedChange('longBio', e.target.value)}
                />
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleSaveDetailed} disabled={loading} className="bg-blue-600 text-white px-8 py-2 rounded-lg">
                  {loading ? "Сохранение..." : (user as any).draftStatus === 'PENDING' ? "Обновить черновик" : "Сохранить черновик"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Вкладка 3: Фотографии */}
        <div className={cn(activeTab !== 'photos' && "hidden")}>
          {isCandidate ? (
            <LockedFeature 
              title="Загрузка фото недоступна" 
              description="Вы сможете добавить фотографии профиля после того, как ваша анкета пройдет предварительную проверку." 
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50">
                    <img src={photo.url} className="w-full h-full object-cover" alt="Фото профиля" />
                    
                    {/* Статус модерации: если даты верификации нет — показываем плашку */}
                    {!photo.verifiedAt && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
                          На модерации
                        </span>
                      </div>
                    )}

                    {/* Индикатор главного фото (если совпадает с avatarUrl) */}
                    {user.avatarUrl === photo.url && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Панель действий */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={() => handleSetMain(photo.id)} 
                        className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform shadow-md"
                        title="Сделать главным"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePhoto(photo.id)} 
                        className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform shadow-md"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Слот для загрузки */}
                {photos.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all group">
                    <Plus className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase group-hover:text-blue-500">Загрузить</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      disabled={loading} 
                    />
                  </label>
                )}
              </div>
              <p className="text-[11px] text-gray-400 italic">
                * Вы можете загрузить до 5 фотографий. Первое фото будет основным в поиске.
              </p>
            </div>
          )}
        </div>

        {/* Вкладка 4: Документы */}
        <div className={cn(activeTab !== 'docs' && "hidden")}>
          {isCandidate ? (
            <LockedFeature 
              title="Документы недоступны" 
              description="Вы сможете загрузить дипломы и сертификаты после прохождения предварительной модерации. Сейчас они не требуются." 
            />
          ) : (
            <DocumentsTab 
              documents={user.documents}
              loading={loading}
              onUpload={handleDocUpload} 
              onDelete={handleDeleteDoc}
              onUpdateMetadata={handleUpdateDocData}
            />
          )}
        </div>
      </div>
    </div>
  )
}