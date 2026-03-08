import React from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Document, DocumentType } from '@prisma/client';
import { Input } from '@/components/ui/Input'; 

interface DocumentsTabProps {
  documents: Document[];
  loading: boolean;
  onUpload: (file: File, type: DocumentType) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateMetadata: (id: string, data: any) => Promise<void>;
}

const SECTIONS: { 
  type: DocumentType; 
  title: string; 
  description: string; 
  iconPath: string; 
  styles: { accent: string; border: string; bg: string };
}[] = [
  {
    type: 'ACADEMIC_EDUCATION',
    title: 'Академическое образование',
    description: 'Высшее образование, магистратура, ученые степени и звания',
    iconPath: '/images/edu-icons/academic.png',
    styles: { accent: 'text-gray-700', border: 'border-gray-100', bg: 'bg-gray-50/50' }
  },
  {
    type: 'PROFESSIONAL_TRAINING',
    title: 'Профессиональная подготовка',
    description: 'Переподготовка (ПП) и повышение квалификации (ППК)',
    iconPath: '/images/edu-icons/qualification.png',
    styles: { accent: 'text-gray-700', border: 'border-gray-100', bg: 'bg-gray-50/50' }
  },
  {
    type: 'COURSE',
    title: 'Курсы и интенсивы',
    description: 'Вебинары, авторские курсы, тренинги',
    iconPath: '/images/edu-icons/course.png',
    styles: { accent: 'text-gray-700', border: 'border-gray-100', bg: 'bg-gray-50/50' }
  },
  {
    type: 'SUPPORTING_DOC',
    title: 'Другие документы',
    description: 'Справки, лицензии и прочие файлы',
    iconPath: '/images/edu-icons/other.png',
    styles: { accent: 'text-gray-700', border: 'border-gray-100', bg: 'bg-gray-50/50' }
  }
];

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  loading,
  onUpload,
  onDelete,
  onUpdateMetadata
}) => {
  return (
    <div className="space-y-10 pb-10">
      {SECTIONS.map((section) => {
        const sectionDocs = documents.filter((d) => d.type === section.type);

        return (
          <div key={section.type} className="space-y-3">
            {/* Заголовок секции */}
            <div className="border-b border-gray-100 pb-1 pt-10">
              <h2 className={`text-lg font-bold ${section.styles.accent}`}>{section.title}</h2>
              <p className="text-xs text-gray-400 italic">{section.description}</p>
            </div>

            {/* Список документов */}
            <div className="space-y-3">
              {sectionDocs.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`flex flex-col md:flex-row items-center gap-2 p-0 bg-white border-b  transition-all hover:shadow-sm ${section.styles.border}`}
                >
                  {/* ЛЕВАЯ ЧАСТЬ: Укрупненная иконка и действия */}
                  <div className="flex items-center gap-3 shrink-0 md:pl-1"> 
                    <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-white  flex items-center justify-center">
                      <img src={section.iconPath} alt="icon" className="w-24 h-24 object-contain" />
                    </div>
                  </div>

                  {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Поля ввода */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-end w-full">
                    <div className="md:col-span-5">
                      <Input 
                        placeholder="Учебное заведение"
                        value={doc.organization || ''}
                        className="h-10 text-sm" // Чуть увеличили высоту инпута для баланса
                        onChange={(e) => onUpdateMetadata(doc.id, { organization: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Input 
                        placeholder="Специальность / Программа"
                        value={doc.programName || ''}
                        className="h-10 text-sm"
                        onChange={(e) => onUpdateMetadata(doc.id, { programName: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input 
                        type="number"
                        placeholder="Год"
                        value={doc.year || ''}
                        className="h-10 text-sm"
                        onChange={(e) => onUpdateMetadata(doc.id, { year: parseInt(e.target.value) || null })}
                      />
                    </div>
                  </div>

                  {/* ПРАВАЯ ЧАСТЬ: Действия */}
                  <div className="flex items-center justify-end pl-2 md:mr-1">
                    {/* Ссылка и статус (чуть компактнее отступ) */}
                    <div className="flex flex-col gap-1.5 ml-1 mr-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg inline-block w-fit tracking-tight ${
                        doc.verifiedAt ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {doc.verifiedAt ? 'Проверено' : 'Проверка'}
                      </span>
                    </div>
                    <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 hover:underline hover:text-blue-600 uppercase tracking-wider"
                      >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button 
                      onClick={() => onDelete(doc.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Элемент загрузки (уменьшенная высота) */}
              <label className={`
                border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3
                cursor-pointer transition-all hover:bg-white min-h-[64px]
                ${section.styles.border} ${section.styles.bg} group
              `}>
                <div className="w-8 h-8 bg-white border rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">Загрузить документ</p>
                  <p className="text-[10px] text-gray-400 uppercase">PDF, JPG, PNG до 10MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,application/pdf" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file, section.type);
                    e.target.value = '';
                  }}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};