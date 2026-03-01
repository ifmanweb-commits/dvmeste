import { notFound } from "next/navigation";
import { getPsychologistById } from "@/lib/actions/manager-psychologist";
import { getDataListItems } from "@/lib/actions/manager-references";
import EditPsychologistForm from "@/components/psychologist/EditPsychologistForm";

export default async function EditPsychologistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
                         
  const { id } = await params;
  
                                          
  const psychologist = await getPsychologistById(id);
  
  if (!psychologist) {
    notFound();
  }
  
                                     
  const [workFormats, certificationLevels] = await Promise.all([
    getDataListItems('work-formats'),
    getDataListItems('certification-levels'),
  ]);

  return (
    <EditPsychologistForm
      psychologist={psychologist}
      psychologistId={id}
      initialWorkFormats={workFormats}
      initialCertificationLevels={certificationLevels}
    />
  );
}