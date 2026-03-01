import { getPsychologistsList } from "@/lib/actions/admin-psychologists";
import ArticleForm from "@/components/articles/ArticleForm";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

export default async function AdminArticleNewPage() {
                                    
  const psychologists = await getPsychologistsList();

  return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <span className="font-semibold text-xl text-[#5858E2]">Добавить статью</span>
          </CardHeader>
          <CardContent>
            <ArticleForm
                psychologists={psychologists}
            />
          </CardContent>
        </Card>
      </div>
  );
}
