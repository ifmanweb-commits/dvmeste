import { getPsychologistsList } from "@/lib/actions/admin-psychologists";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import ArticleNewClient from "./ArticleNewClient";

export default async function AdminArticleNewPage() {
  const psychologists = await getPsychologistsList();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-0 ">
        <CardContent>
          <ArticleNewClient psychologists={psychologists} />
        </CardContent>
    </div>
  );
}