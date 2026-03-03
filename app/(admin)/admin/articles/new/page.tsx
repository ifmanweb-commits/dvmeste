import { getPsychologistsList } from "@/lib/actions/admin-psychologists";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import ArticleNewClient from "./ArticleNewClient";

export default async function AdminArticleNewPage() {
  const psychologists = await getPsychologistsList();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <span className="font-semibold text-xl text-[#5858E2]">Добавить статью</span>
        </CardHeader>
        <CardContent>
          <ArticleNewClient psychologists={psychologists} />
        </CardContent>
      </Card>
    </div>
  );
}