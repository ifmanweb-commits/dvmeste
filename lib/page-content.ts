"use server";

import { prisma } from "@/lib/db";

   
                                                                       
                                                                    
   
export async function getPageBySlug(slug: string) {
  if (!prisma) return null;
  try {
    const page = await prisma.page.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        metaRobots: true,
        template: true,
        content: true,
        customHead: true,
        showHeader: true,
        showFooter: true,
        isPublished: true,
      },
    });
    return page;
  } catch {
    return null;
  }
}
