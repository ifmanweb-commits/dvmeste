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

   
                                  
   

