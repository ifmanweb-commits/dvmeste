import React from 'react';
import { Plus, Trash2, ExternalLink, GraduationCap, Award, FileBadge, FolderOpen } from 'lucide-react';
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
  icon: React.ReactNode;
  styles: { accent: string; border: string; bg: string; gradient: string };
}[] = [
  {
    type: 'ACADEMIC_EDUCATION',
    title: 'Академическое образование',
    description: 'Высшее образование, магистратура, ученые степени и звания',
    icon: <GraduationCap className="w-8 h-8 md:w-10 md:h-10" />,
    styles: { accent: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50/50', gradient: 'from-indigo-50 to-blue-50' }
  },
  {
    type: 'PROFESSIONAL_TRAINING',
    title: 'Профессиональная подготовка',
    description: 'Переподготовка (ПП) и повышение квалификации (ППК)',
    icon: <Award className="w-8 h-8 md:w-10 md:h-10" />,
    styles: { accent: 'text-purple-600', border: 'border-purple-100', bg: 'bg-purple-50/50', gradient: 'from-purple-50 to-pink-50' }
  },
  {
    type: 'COURSE',
    title: 'Курсы и интенсивы',
    description: 'Вебинары, авторские курсы, тренинги',
    icon: <FileBadge className="w-8 h-8 md:w-10 md:h-10" />,
    styles: { accent: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50/50', gradient: 'from-amber-50 to-orange-50' }
  },
  {
    type: 'SUPPORTING_DOC',
    title: 'Другие документы',
    description: 'Справки, лицензии и прочие файлы',
    icon: <FolderOpen className="w-8 h-8 md:w-10 md:h-10" />,
    styles: { accent: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50/50', gradient: 'from-emerald-50 to-teal-50' }
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
    <div className="space-y-8 pb-6">
      {SECTIONS.map((section) => {
        const sectionDocs = documents.filter((d) => d.type === section.type);

        return (
          <div key={section.type} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Заголовок секции */}
            <div className={`bg-gradient-to-r ${section.styles.gradient} px-6 py-4 border-b ${section.styles.border}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-lg shadow-sm ${section.styles.accent}`}>
                  {section.icon}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${section.styles.accent}`}>{section.title}</h2>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Список документов */}
              <div className="space-y-4">
                {sectionDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-50 rounded-xl border transition-all hover:shadow-sm ${section.styles.border}`}
                  >
                    {/* ЛЕВАЯ ЧАСТЬ: Укрупненная иконка */}
                    <div className="flex items-center gap-3 shrink-0"> 
                      <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm ${section.styles.accent}`}>
                        {section.icon}
                      </div>
                    </div>

                    {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Поля ввода */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                      <div className="md:col-span-5">
                        <Input 
                          placeholder="Учебное заведение"
                          value={doc.organization || ''}
                          className="h-10 text-sm"
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
                    <div className="flex items-center gap-2 md:ml-auto">
                      {/* Статус */}
                      <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg inline-block tracking-tight ${
                        doc.verifiedAt ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {doc.verifiedAt ? 'Проверено' : 'Проверка'}
                      </span>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Открыть документ"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Элемент загрузки */}
                <label className={`
                  border-2 border-dashed rounded-xl p-5 flex items-center gap-4
                  cursor-pointer transition-all hover:bg-gray-50
                  ${section.styles.border} ${section.styles.bg} group
                `}>
                  <div className="w-10 h-10 bg-white border rounded-full flex items-center justify-center group-hover:scale-110 group-hover:border-blue-300 transition-all shadow-sm">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700">Загрузить документ</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">PDF, JPG, PNG до 10MB</p>
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
          </div>
        );
      })}
    </div>
  );
};