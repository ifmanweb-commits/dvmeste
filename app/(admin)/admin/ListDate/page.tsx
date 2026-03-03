import { getDataListItems } from "@/lib/actions/admin-references";
import ReferencesClient from "./ReferencesClient";

export default async function ListDatePage() {

  
  // Получаем данные
  const [workFormats, paradigms, certificationLevels, articleTags] = await Promise.all([
    getDataListItems('work-formats'),
    getDataListItems('paradigms'),
    getDataListItems('certification-levels'),
    getDataListItems('article-tags'),
  ]);

  return (
    <ReferencesClient 
      initialData={{
        'work-formats': workFormats,
        'paradigms': paradigms,
        'certification-levels': certificationLevels,
        'article-tags': articleTags,
      }}
    />
  );
}