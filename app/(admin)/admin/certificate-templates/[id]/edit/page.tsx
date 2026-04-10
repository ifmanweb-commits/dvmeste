'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCertificateTemplateById,
  updateCertificateTemplate,
  updateTemplateFields,
  generateCertificatePreview
} from '@/lib/actions/certificate-templates';
import { CertificateTemplate } from '@prisma/client';

// Предопределённые переменные для шаблонов
const AVAILABLE_VARIABLES = [
  { value: 'user.fullName', label: 'ФИО пользователя' },
  { value: 'user.email', label: 'Email пользователя' },
  { value: 'certification.name', label: 'Название сертификации' },
  { value: 'certification.level', label: 'Уровень сертификации' },
  { value: 'award.issuedAt', label: 'Дата выдачи награды' },
  { value: 'award.id', label: 'ID награды' },
  { value: 'award.verificationCode', label: 'Проверочный код сертификата' },
] as const;

const DATE_FORMATS = [
  { value: 'DD.MM.YYYY', label: 'ДД.ММ.ГГГГ' },
  { value: 'DD/MM/YYYY', label: 'ДД/ММ/ГГГГ' },
  { value: 'MM.DD.YYYY', label: 'ММ.ДД.ГГГГ' },
  { value: 'YYYY-MM-DD', label: 'ГГГГ-ММ-ДД' },
  { value: 'DD Month YYYY', label: 'ДД Месяц ГГГГ' },
] as const;

interface FieldConfig {
  name: string;
  label: string;
  variable: string;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  formatDate: boolean;
  dateFormat: string;
}

interface FieldsJson {
  fields: FieldConfig[];
  background: {
    width: number;
    height: number;
    previewWidth: number;
    previewHeight: number;
  };
}

const DEFAULT_FIELD: FieldConfig = {
  name: '',
  label: '',
  variable: '',
  xPercent: 50,
  yPercent: 50,
  fontSize: 24,
  fontColor: '#333333',
  fontFamily: 'PT Serif',
  textAlign: 'center',
  fontWeight: 'normal',
  formatDate: false,
  dateFormat: 'DD.MM.YYYY',
};

export default function EditCertificateTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [fieldsJson, setFieldsJson] = useState<FieldsJson>({
    fields: [],
    background: { width: 0, height: 0, previewWidth: 0, previewHeight: 0 }
  });
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [showTestBlock, setShowTestBlock] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [fieldNameError, setFieldNameError] = useState<string | null>(null);
  
  // Drag-n-drop состояние
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Валидация имени поля (латиница, без пробелов)
  function validateFieldName(value: string): string | null {
    if (!value) return null;
    const latinPattern = /^[a-zA-Z0-9_]+$/;
    if (!latinPattern.test(value)) {
      return 'Имя поля должно содержать только латинские буквы, цифры и подчёркивание';
    }
    if (value.includes(' ')) {
      return 'Имя поля не должно содержать пробелов';
    }
    return null;
  }

  function handleFieldNameChange(index: number, value: string) {
    const error = validateFieldName(value);
    setFieldNameError(error);
    handleUpdateField(index, { name: value });
  }

  function handleVariableChange(index: number, variable: string) {
    // Автоматически устанавливаем label на основе выбранной переменной
    const varInfo = AVAILABLE_VARIABLES.find(v => v.value === variable);
    if (varInfo) {
      handleUpdateField(index, { variable, label: varInfo.label });
    } else {
      handleUpdateField(index, { variable });
    }
  }

  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    setLoading(true);
    const result = await getCertificateTemplateById(templateId);
    if (result) {
      setTemplate(result);
      const fj = result.fieldsJson as unknown as FieldsJson;
      setFieldsJson(fj || { fields: [], background: { width: 0, height: 0, previewWidth: 0, previewHeight: 0 } });
    }
    setLoading(false);
  }

  function handleImageLoad() {
    if (imgRef.current) {
      setImageDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
    }
  }

  async function handleSaveBasicInfo(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await updateCertificateTemplate(templateId, formData);
    if (result.error) {
      setError(result.error);
    } else {
      // Обновляем локально
      if (result.template) {
        setTemplate(result.template);
      }
    }
    setSaving(false);
  }

  async function handleSaveFields() {
    setSaving(true);
    setError(null);
    await updateTemplateFields(templateId, fieldsJson);
    setSaving(false);
  }

  async function handleGeneratePreview() {
    setGeneratingPreview(true);
    const result = await generateCertificatePreview(templateId, testValues);
    if (result.success && result.dataUrl) {
      setPreviewImage(result.dataUrl);
    } else {
      setError(result.error || 'Ошибка генерации');
    }
    setGeneratingPreview(false);
  }

  function handleAddField() {
    const newField: FieldConfig = {
      ...DEFAULT_FIELD,
      name: `field${fieldsJson.fields.length + 1}`,
      label: `Поле ${fieldsJson.fields.length + 1}`,
    };
    setFieldsJson({
      ...fieldsJson,
      fields: [...fieldsJson.fields, newField]
    });
    setSelectedFieldIndex(fieldsJson.fields.length);
  }

  function handleRemoveField(index: number) {
    const newFields = fieldsJson.fields.filter((_, i) => i !== index);
    setFieldsJson({ ...fieldsJson, fields: newFields });
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  }

  function handleUpdateField(index: number, updates: Partial<FieldConfig>) {
    const newFields = [...fieldsJson.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFieldsJson({ ...fieldsJson, fields: newFields });
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (selectedFieldIndex === null || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    handleUpdateField(selectedFieldIndex, { xPercent, yPercent });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('name', template?.name || '');
      formData.append('slug', template?.slug || '');
      formData.append('isActive', template?.isActive ? 'on' : 'off');
      formData.append('background', file);
      handleSaveBasicInfo(formData);
    }
  }

  // Drag-n-drop обработчики
  function handleMarkerMouseDown(e: React.MouseEvent<HTMLDivElement>, index: number) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFieldIndex(index);
    setIsDragging(true);
    
    const marker = e.currentTarget;
    const rect = marker.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Вычисляем смещение клика относительно центра маркера
    const offsetX = clickX - (rect.left + rect.width / 2);
    const offsetY = clickY - (rect.top + rect.height / 2);
    
    setDragOffset({ x: offsetX, y: offsetY });
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging || selectedFieldIndex === null || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    
    // Получаем координаты мыши относительно изображения
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Конвертируем в проценты
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Ограничиваем в пределах 0-100%
    const clampedX = Math.max(0, Math.min(100, xPercent));
    const clampedY = Math.max(0, Math.min(100, yPercent));
    
    handleUpdateField(selectedFieldIndex, { xPercent: clampedX, yPercent: clampedY });
  }

  function handleCanvasMouseUp() {
    setIsDragging(false);
  }

  function handleMarkerMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setIsDragging(false);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Редактирование шаблона</h1>
        <p className="text-gray-600">{template?.name}</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Основная информация */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
        <form action={handleSaveBasicInfo} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              type="text"
              name="name"
              defaultValue={template?.name || ''}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              name="slug"
              defaultValue={template?.slug || ''}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Фоновое изображение</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-md"
            />
            {template?.backgroundUrl && (
              <p className="mt-1 text-sm text-gray-500">Текущий: {template.backgroundUrl}</p>
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={template?.isActive}
              className="h-4 w-4"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Активен</label>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>

      {/* Редактор полей */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Список полей */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Поля</h2>
              <button
                onClick={handleAddField}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                + Добавить
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fieldsJson.fields.map((field, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedFieldIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedFieldIndex(index)}
                >
                  <div className="font-medium text-sm">{field.label || field.name}</div>
                  <div className="text-xs text-gray-500">{field.variable || field.name}</div>
                </div>
              ))}
            </div>

            {selectedFieldIndex !== null && fieldsJson.fields[selectedFieldIndex] && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h3 className="font-medium">Настройки поля</h3>
                
                <div>
                  <label className="block text-xs text-gray-600">Переменная *</label>
                  <select
                    value={fieldsJson.fields[selectedFieldIndex].variable}
                    onChange={(e) => handleVariableChange(selectedFieldIndex, e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Выберите переменную</option>
                    {AVAILABLE_VARIABLES.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Имя поля (латиница, без пробелов)</label>
                  <input
                    type="text"
                    value={fieldsJson.fields[selectedFieldIndex].name}
                    onChange={(e) => handleFieldNameChange(selectedFieldIndex, e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-sm ${fieldNameError ? 'border-red-500 bg-red-50' : ''}`}
                    placeholder="Например: fullName, studentName"
                  />
                  {fieldNameError && (
                    <p className="text-xs text-red-600 mt-1">{fieldNameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Метка</label>
                  <input
                    type="text"
                    value={fieldsJson.fields[selectedFieldIndex].label}
                    onChange={(e) => handleUpdateField(selectedFieldIndex, { label: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Форматировать как дату</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={fieldsJson.fields[selectedFieldIndex].formatDate}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, { formatDate: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-gray-600">Применить форматирование даты</span>
                  </div>
                </div>

                {fieldsJson.fields[selectedFieldIndex].formatDate && (
                  <div>
                    <label className="block text-xs text-gray-600">Формат даты</label>
                    <select
                      value={fieldsJson.fields[selectedFieldIndex].dateFormat}
                      onChange={(e) => handleUpdateField(selectedFieldIndex, { dateFormat: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {DATE_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">X %</label>
                  <input
                    type="number"
                    value={Math.round(fieldsJson.fields[selectedFieldIndex].xPercent)}
                    onChange={(e) => handleUpdateField(selectedFieldIndex, { xPercent: Number(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Y %</label>
                  <input
                    type="number"
                    value={Math.round(fieldsJson.fields[selectedFieldIndex].yPercent)}
                    onChange={(e) => handleUpdateField(selectedFieldIndex, { yPercent: Number(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Размер шрифта (8-200)</label>
                <input
                  type="number"
                  value={fieldsJson.fields[selectedFieldIndex].fontSize}
                  onChange={(e) => handleUpdateField(selectedFieldIndex, { fontSize: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="8"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Цвет</label>
                <input
                  type="color"
                  value={fieldsJson.fields[selectedFieldIndex].fontColor}
                  onChange={(e) => handleUpdateField(selectedFieldIndex, { fontColor: e.target.value })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Начертание шрифта</label>
                <select
                  value={fieldsJson.fields[selectedFieldIndex].fontWeight}
                  onChange={(e) => handleUpdateField(selectedFieldIndex, { fontWeight: e.target.value as 'normal' | 'bold' })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="normal">Обычный (Regular)</option>
                  <option value="bold">Жирный (Bold)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Выравнивание</label>
                <select
                  value={fieldsJson.fields[selectedFieldIndex].textAlign}
                  onChange={(e) => handleUpdateField(selectedFieldIndex, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="left">Слева</option>
                  <option value="center">По центру</option>
                  <option value="right">Справа</option>
                </select>
              </div>
              <button
                onClick={() => handleRemoveField(selectedFieldIndex)}
                className="w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Удалить поле
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleSaveFields}
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить поля'}
            </button>
          </div>
        </div>

        {/* Превью */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Превью (кликните для установки координат)</h2>
          
          {template?.backgroundUrl ? (
            <div
              ref={canvasRef}
              className="relative border border-gray-300 overflow-hidden inline-block"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <img
                ref={imgRef}
                src={template.backgroundUrl}
                alt="Background"
                className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                onLoad={handleImageLoad}
                draggable={false}
              />
              {fieldsJson.fields.map((field, index) => (
                <div
                  key={index}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 border-2 ${
                    selectedFieldIndex === index
                      ? 'border-blue-500 bg-blue-500/30'
                      : 'border-red-500 bg-red-500/30'
                  } ${isDragging && selectedFieldIndex === index ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{
                    left: `${field.xPercent}%`,
                    top: `${field.yPercent}%`,
                    fontSize: `${Math.min(field.fontSize / 10, 2)}px`,
                    minWidth: '80px',
                    minHeight: '20px',
                    zIndex: isDragging && selectedFieldIndex === index ? 10 : 1,
                  }}
                  onMouseDown={(e) => handleMarkerMouseDown(e, index)}
                  onMouseUp={handleMarkerMouseUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFieldIndex(index);
                  }}
                >
                  <span className="text-white text-xs whitespace-nowrap px-1 select-none">{field.label || field.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">
              Загрузите фоновое изображение в основной информации
            </div>
          )}

          {/* Тестовая генерация */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => setShowTestBlock(!showTestBlock)}
              className="text-blue-600 hover:underline"
            >
              {showTestBlock ? 'Скрыть тестовую генерацию' : 'Тестовая генерация'}
            </button>

            {showTestBlock && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {fieldsJson.fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-xs text-gray-600">{field.label || field.name}</label>
                      <input
                        type="text"
                        value={testValues[field.name] || ''}
                        onChange={(e) => setTestValues({ ...testValues, [field.name]: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder={`Значение для ${field.label}`}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGeneratePreview}
                  disabled={generatingPreview || fieldsJson.fields.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {generatingPreview ? 'Генерация...' : 'Сгенерировать превью'}
                </button>

                {previewImage && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Результат:</h3>
                    <img src={previewImage} alt="Generated preview" className="max-w-full h-auto border rounded" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/admin/certificate-templates')}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Назад к списку
        </button>
      </div>
    </div>
  );
}