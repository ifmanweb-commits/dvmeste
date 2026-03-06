import { notFound } from 'next/navigation';
import PageFormContainer from '@/components/admin/pages/PageFormContainer';
import { requireAdmin } from '@/lib/auth/require';
import { getPageById } from '@/lib/actions/admin-pages';

export default async function EditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requireAdmin();
  
  const { id } = await params;
  const page = await getPageById(id);
  
  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Редактирование: {page.adminTitle}</h1>
      <PageFormContainer initialData={page} />
    </div>
  );
}