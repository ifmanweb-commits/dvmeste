import { notFound } from "next/navigation";
import { getPsychologistById, updatePsychologist } from "@/lib/actions/admin-psychologists";
import { EducationFormEdit } from '@/components/admin/EducationFormEdit';

type PageProps = { params: Promise<{ id: string }> };

                                                                      
function safeParseEducation(data: unknown): Array<{
  year: string;
  type: string;
  organization: string;
  title: string;
  isDiploma?: boolean;
}> {
  if (!data) return [];
  
  try {
    if (Array.isArray(data)) {
      return data.map((item: unknown) => {
        const row = (item && typeof item === "object") ? (item as Record<string, unknown>) : {};
        return {
        year: typeof row.year === "string" || typeof row.year === "number" ? String(row.year) : "",
        type: typeof row.type === "string" ? row.type : "",
        organization: typeof row.organization === "string" ? row.organization : "",
        title: typeof row.title === "string" ? row.title : "",
        isDiploma: Boolean(row.isDiploma)
      };
      }).filter(item => 
        item.year || item.type || item.organization || item.title
      );
    }
  } catch (error) {
    console.error("Error parsing education data:", error);
  }
  
  return [];
}

   
                                  
   
export default async function EditPsychologistPage({ params }: PageProps) {
  const { id } = await params;
  const p = await getPsychologistById(id);
  if (!p) notFound();

                                                
  const educationData = safeParseEducation(p.education);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">
            Редактировать: {p.fullName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            ID: {p.id} | Создано: {new Date(p.createdAt).toLocaleDateString('ru-RU')}
          </p>

          <form action={updatePsychologist.bind(null, id)} className="mt-8 space-y-8">
            {                         }
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Основная информация</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    defaultValue={p.fullName}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL адрес страницы *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/psy-list/</span>
                    <input
                      type="text"
                      name="slug"
                      required
                      defaultValue={p.slug}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                    />
                  </div>
                </div>
              </div>

              {                                                    }

              {                 }
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Образование и сертификации</h2>
                <div>
                  <EducationFormEdit initialData={educationData} />
                </div>
              </div>

              {                                     }
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
