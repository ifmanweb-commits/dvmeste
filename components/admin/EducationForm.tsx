"use client";

import { useState } from "react";

type EducationItem = {
  year: string;
  type: string;
  organization: string;
  title: string;
  isDiploma: boolean;
};

export function EducationForm() {
  const [educations, setEducations] = useState<EducationItem[]>([
    { year: "", type: "", organization: "", title: "", isDiploma: false }
  ]);

  const addEducation = () => {
    setEducations([
      ...educations,
      { year: "", type: "", organization: "", title: "", isDiploma: false }
    ]);
  };

  const removeEducation = (index: number) => {
    if (educations.length <= 1) return;
    const newEducations = [...educations];
    newEducations.splice(index, 1);
    setEducations(newEducations);
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string | boolean) => {
    const newEducations = [...educations];
    newEducations[index] = { ...newEducations[index], [field]: value };
    setEducations(newEducations);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">Образование</label>
      
      {educations.map((edu, index) => (
        <div key={index} className="mb-4 p-4 border border-neutral-200 rounded-lg bg-white">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-foreground">Образование #{index + 1}</h4>
            {educations.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                ✕ Удалить
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {         }
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Год получения документа</label>
              <input
                type="number"
                name={`education[${index}][year]`}
                value={edu.year}
                onChange={(e) => updateEducation(index, "year", e.target.value)}
                placeholder="2020"
                min="1900"
                max="2100"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                required
              />
            </div>

            {         }
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Тип образования</label>
              <select
                name={`education[${index}][type]`}
                value={edu.type}
                onChange={(e) => updateEducation(index, "type", e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Выберите...</option>
                <option value="диплом">Диплом</option>
                <option value="сертификат">Сертификат</option>
                <option value="удостоверение">Удостоверение</option>
              </select>
            </div>

            {                 }
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Название организации, выдавшей документ </label>
              <input
                type="text"
                name={`education[${index}][organization]`}
                value={edu.organization}
                onChange={(e) => updateEducation(index, "organization", e.target.value)}
                placeholder="МГУ, Институт..."
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                required
              />
            </div>

            {              }
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Название документа</label>
              <input
                type="text"
                name={`education[${index}][title]`}
                value={edu.title}
                onChange={(e) => updateEducation(index, "title", e.target.value)}
                placeholder="Специальность, программа..."
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                required
              />
            </div>

            {            }
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={`education[${index}][isDiploma]`}
                  checked={edu.isDiploma}
                  onChange={(e) => updateEducation(index, "isDiploma", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Это диплом</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="mt-2 text-sm text-[#5858E2] hover:text-[#4848d0]"
      >
        + Добавить образование
      </button>
      
      <input
        type="hidden"
        name="education"
        value={JSON.stringify(educations.filter(e => e.year && e.type && e.organization && e.title))}
      />
    </div>
  );
}