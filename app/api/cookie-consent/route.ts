import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Устанавливаем cookie на 1 год (365 дней)
  response.cookies.set("cookie_consent", "true", {
    maxAge: 365 * 24 * 60 * 60, // 365 дней в секундах
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  
  return response;
}