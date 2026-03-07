import React from 'react';
import { Plus, FileText, Trash2, Calendar, School, GraduationCap, ExternalLink } from 'lucide-react';
import { Document, DocumentType } from '@prisma/client';
import { Input } from '@/components/ui/ProfileFields';

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
  gridClass: string; 
  styles: any; 
}[] = [
  {
    type: 'ACADEMIC_EDUCATION',
    title: 'Академическое образование',
    description: 'Высшее образование, магистратура, ученые степени и звания',
    gridClass: 'grid-cols-1', 
    styles: { bg: 'bg-blue-50/50', border: 'border-blue-100', accent: 'bg-blue-600', text: 'text-blue-700' }
  },
  {
    type: 'PROFESSIONAL_TRAINING',
    title: 'Профессиональная подготовка',
    description: 'Переподготовка (ПП) и повышение квалификации (ППК)',
    gridClass: 'grid-cols-1 md:grid-cols-2',
    styles: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', accent: 'bg-emerald-600', text: 'text-emerald-700' }
  },
  {
    type: 'COURSE',
    title: 'Курсы и интенсивы',
    description: 'Вебинары, авторские курсы, тренинги',
    gridClass: 'grid-cols-1 md:grid-cols-2',
    styles: { bg: 'bg-slate-50', border: 'border-slate-200', accent: 'bg-slate-500', text: 'text-slate-600' }
  },
  {
    type: 'SUPPORTING_DOC',
    title: 'Другие документы',
    description: 'Справки, лицензии и прочие файлы',
    gridClass: 'grid-cols-1 md:grid-cols-2',
    styles: { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'bg-gray-400', text: 'text-gray-500' }
  }
];

const DocPreview = ({ url, filename }: { url: string; filename: string | null }) => {
  const isPDF = url.toLowerCase().endsWith('.pdf') || filename?.toLowerCase().endsWith('.pdf');
  
  if (isPDF) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
        <FileText className="w-8 h-8 mb-1" />
        <span className="text-[10px] font-bold uppercase">PDF</span>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt="Document" 
      className="w-full h-full object-cover transition-transform group-hover:scale-105"
    />
  );
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  loading,
  onUpload,
  onDelete,
  onUpdateMetadata
}) => {
  return (
    <div className="space-y-12 pb-10">
      {SECTIONS.map((section) => {
        const sectionDocs = documents.filter((d) => d.type === section.type);

        return (
          <div key={section.type} className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex justify-between items-end">
              <div>
                <h3 className={`text-lg font-bold ${section.styles.text}`}>{section.title}</h3>
                <p className="text-xs text-gray-400">{section.description}</p>
              </div>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                Найдено: {sectionDocs.length}
              </span>
            </div>

            <div className={`grid gap-6 ${section.gridClass}`}>
              {sectionDocs.map((doc) => (
                <div key={doc.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${section.styles.border}`}>
                  
                  {/* Верхняя часть: Превью и статус */}
                  <div className="relative h-40 w-full group bg-gray-50 border-b border-gray-100">
                    <DocPreview url={doc.url} filename={doc.filename} />
                    
                    {/* Кнопки поверх превью */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-white/90 backdrop-blur shadow-sm text-gray-600 rounded-full hover:bg-white transition-colors"
                        title="Открыть оригинал"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 bg-red-50/90 backdrop-blur shadow-sm text-red-600 rounded-full hover:bg-red-100 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Бейдж верификации */}
                    <div className="absolute bottom-3 left-3">
                       <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md shadow-sm ${
                        doc.verifiedAt ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'
                      }`}>
                        {doc.verifiedAt ? 'Верифицирован' : 'На проверке'}
                      </span>
                    </div>
                  </div>

                  {/* Нижняя часть: Поля данных под картинкой */}
                  <div className="p-5 space-y-4 flex-1">
                    <div className="space-y-4">
                      <Input 
                        label="Учебное заведение"
                        placeholder="Напр: МГУ им. Ломоносова"
                        value={doc.organization || ''}
                        onChange={(e) => onUpdateMetadata(doc.id, { organization: e.target.value })}
                      />

                      <Input 
                        label="Специальность / Программа"
                        placeholder="Напр: Клиническая психология"
                        value={doc.programName || ''}
                        onChange={(e) => onUpdateMetadata(doc.id, { programName: e.target.value })}
                      />

                      <div className="w-1/2">
                        <Input 
                          label="Год окончания"
                          type="number"
                          placeholder="2020"
                          value={doc.year?.toString() || ''}
                          onChange={(e) => onUpdateMetadata(doc.id, { year: parseInt(e.target.value) || null })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Кнопка добавления */}
              <label className={`
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center 
                cursor-pointer transition-all hover:bg-white min-h-[280px]
                ${section.styles.border} ${section.styles.bg} group
              `}>
                <div className="w-12 h-12 bg-white border rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Добавить файл</span>
                <span className="text-[10px] text-gray-400 mt-1 uppercase">JPG, PNG, PDF до 10MB</span>
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