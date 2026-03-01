'use client';

import { useState, useEffect } from 'react';

export interface EducationItem {
  year?: string;
  type?: string;
  organization?: string;
  title?: string;
  isDiploma?: boolean;
}

interface Props {
  initialData?: EducationItem[];
  onEducationUpdate?: (education: EducationItem[]) => void;
}

export function EducationFormEdit({ initialData = [], onEducationUpdate }: Props) {
                                                   
  const [education, setEducation] = useState<EducationItem[]>(
    initialData.length > 0 ? initialData : [{ year: '', type: '', organization: '', title: '', isDiploma: false }]
  );

                                                 
  useEffect(() => {
    if (onEducationUpdate) {
      onEducationUpdate(education);
    }
    
                                            
    const hiddenInput = document.querySelector('input[name="education"]');
    if (hiddenInput) {
      (hiddenInput as HTMLInputElement).value = JSON.stringify(education);
    }
  }, [education, onEducationUpdate]);

  const addEducation = () => {
    setEducation([...education, { year: '', type: '', organization: '', title: '', isDiploma: false }]);
  };

  const removeEducation = (index: number) => {
    if (education.length > 1) {
      const newEducation = [...education];
      newEducation.splice(index, 1);
      setEducation(newEducation);
    }
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: any) => {
    const newEducation = [...education];
    newEducation[index] = {
      ...newEducation[index],
      [field]: field === 'isDiploma' ? Boolean(value) : value,
    };
    setEducation(newEducation);
  };

                     
  console.log('🎓 EducationFormEdit initialData:', initialData);
  console.log('🎓 EducationFormEdit education state:', education);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Образование и квалификация</h2>
      
      {                                                                           }
      
      {education.map((item, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Образование #{index + 1}</h3>
            {education.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Удалить
              </button>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Год
              </label>
              <input
                type="text"
                name={`education_year_${index}`}
                value={item.year || ''}
                onChange={(e) => updateEducation(index, 'year', e.target.value)}
                placeholder="2023"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип
              </label>
              <select
                name={`education_type_${index}`}
                value={item.type || ''}
                onChange={(e) => updateEducation(index, 'type', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              >
                <option value="">Выберите тип</option>
                <option value="диплом">Диплом</option>
                <option value="сертификат">Сертификат</option>
                <option value="удостоверение">Удостоверение</option>
                <option value="курс">Курс</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Организация
            </label>
            <input
              type="text"
              name={`education_organization_${index}`}
              value={item.organization || ''}
              onChange={(e) => updateEducation(index, 'organization', e.target.value)}
              placeholder="Название университета, института, организации..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название программы / специальности
            </label>
            <input
              type="text"
              name={`education_title_${index}`}
              value={item.title || ''}
              onChange={(e) => updateEducation(index, 'title', e.target.value)}
              placeholder="Психология, Клиническая психология..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name={`education_isDiploma_${index}`}
              id={`isDiploma-${index}`}
              checked={item.isDiploma || false}
              onChange={(e) => updateEducation(index, 'isDiploma', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
            />
            <label htmlFor={`isDiploma-${index}`} className="text-sm text-gray-700">
              Основной диплом психолога
            </label>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addEducation}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
      >
        + Добавить еще образование
      </button>
      
      <p className="text-sm text-gray-500">
        Добавьте все дипломы, сертификаты и курсы психолога. Отметьте основной диплом.
      </p>
    </div>
  );
}