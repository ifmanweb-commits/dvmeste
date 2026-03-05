import PageForm from '@/components/admin/pages/PageForm';
import { requireAdmin } from '@/lib/auth/require';

export default async function NewPage() {
  await requireAdmin();
  
  // Пустые данные для новой страницы
  const initialData = {
    adminTitle: '',
    slug: '',
    template: 'text',
    content: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    metaRobots: '',
    customHead: '',
    isPublished: false,
    images: [],
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Новая страница</h1>
      <PageForm initialData={initialData} />
    </div>
  );
}