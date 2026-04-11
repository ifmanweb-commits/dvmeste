import { getDataListItems } from "@/lib/actions/admin-references";
import ReferencesClient from "./ReferencesClient";
import HorNav from "../management/HorNav";

export default async function ListDatePage() {

  
  // Получаем данные
  const [workFormats, paradigms, certificationLevels, articleTags] = await Promise.all([
    getDataListItems('work-formats'),
    getDataListItems('paradigms'),
    getDataListItems('certification-levels'),
    getDataListItems('article-tags'),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Справочники</h1>
        <p className="text-gray-500 mt-1">Управление справочными данными</p>

        {/* Вкладки */}
        <HorNav />
      </div>

      <div className="mt-6">
        <ReferencesClient 
          initialData={{
            'work-formats': workFormats,
            'paradigms': paradigms,
            'certification-levels': certificationLevels,
            'article-tags': articleTags,
          }}
        />
      </div>
    </div>
  );
}