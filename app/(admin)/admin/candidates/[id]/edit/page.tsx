import { getAllCourses } from "@/lib/actions/courses";
import { getCandidateById } from "@/lib/actions/admin-candidates";
import { EditCandidateForm } from "./EditCandidateForm";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCandidatePage({ params }: PageProps) {
  const { id } = await params;
  
  const candidate = await getCandidateById(id);
  
  if (!candidate) {
    notFound();
  }

  const courses = await getAllCourses();

  return (
    <div className="p-6">
      <EditCandidateForm 
        candidate={candidate}
        courses={courses}
      />
    </div>
  );
}
