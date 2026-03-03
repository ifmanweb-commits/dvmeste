import { Card, CardContent } from "@/components/ui/Card";

interface DashboardStats {
  psychologists: {
    total: number;
    active: number;
    candidate: number;
    suspended: number;
    rejected: number;
    levels: {
      level1: number;
      level2: number;
      level3: number;
      noLevel: number;
    };
  };
  articles: {
    total: number;
    published: number;
    draft: number;
  };
  activity: {
    newPsychologists: number;
    newArticles: number;
  };
}

export function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <>
      {/* Психологи */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Психологи</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Всего</p>
              <p className="text-3xl font-bold text-[#5858E2]">{stats.psychologists.total}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">В каталоге</p>
              <p className="text-3xl font-bold text-green-600">{stats.psychologists.active}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Кандидаты</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.psychologists.candidate}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Заблокировано</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.psychologists.suspended + stats.psychologists.rejected}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Уровни сертификации */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Уровни сертификации</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">1 уровень</p>
              <p className="text-2xl font-bold text-[#5858E2]">{stats.psychologists.levels.level1}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">2 уровень</p>
              <p className="text-2xl font-bold text-[#5858E2]">{stats.psychologists.levels.level2}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">3 уровень</p>
              <p className="text-2xl font-bold text-[#5858E2]">{stats.psychologists.levels.level3}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Без уровня</p>
              <p className="text-2xl font-bold text-gray-600">{stats.psychologists.levels.noLevel}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Статьи */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Статьи</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Всего статей</p>
              <p className="text-3xl font-bold text-[#5858E2]">{stats.articles.total}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Опубликовано</p>
              <p className="text-3xl font-bold text-green-600">{stats.articles.published}</p>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <p className="text-sm text-gray-500">Черновики</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.articles.draft}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}