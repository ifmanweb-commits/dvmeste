import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserCourses, activateCourseKey, getAllCoursesForSelect } from "@/lib/actions/courses";
import TrainingPageClient from "./TrainingPageClient";

export default async function TrainingPage() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [userCourses, allCourses] = await Promise.all([
    getUserCourses(session.user.id),
    getAllCoursesForSelect(),
  ]);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TrainingPageClient 
        userId={session.user.id}
        initialUserCourses={userCourses}
        allCourses={allCourses}
      />
    </Suspense>
  );
}