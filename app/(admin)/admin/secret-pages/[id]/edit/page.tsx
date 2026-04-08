import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateSecretPage, getSecretPageImages } from "../../actions";
import EditSecretPageForm from "./EditSecretPageForm";

interface EditSecretPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSecretPage({ params }: EditSecretPageProps) {
  const { id } = await params;
  
  const page = await prisma.secretPage.findUnique({
    where: { id },
  });

  if (!page) {
    notFound();
  }

  const images = await getSecretPageImages(page.slug);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Редактировать страницу</h1>
          <p className="text-gray-500 mt-1">{page.title}</p>
        </div>
        <Link
          href="/admin/secret-pages"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Назад к списку
        </Link>
      </div>

      <EditSecretPageForm page={page} images={images} />
    </div>
  );
}