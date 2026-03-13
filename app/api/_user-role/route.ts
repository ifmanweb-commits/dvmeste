export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ role: null });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });

    return NextResponse.json({ role: user?.role || null });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json({ role: null });
  }
}