import { NextRequest, NextResponse } from "next/server";
import { getValidSessionToken } from "@/lib/auth-admin";
import { authenticateSuperAdmin } from "@/lib/super-admin";

const IS_PROD = process.env.NODE_ENV === "production";

function setSessionCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier ?? body?.login ?? body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Укажите логин/email и пароль." }, { status: 400 });
    }

    const admin = await authenticateSuperAdmin(identifier, password);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Неверный логин/email или пароль." }, { status: 401 });
    }

    const token = getValidSessionToken();
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        login: admin.login,
        email: admin.email,
        role: "ADMIN",
      },
    });

    setSessionCookie(response, "admin_session", token);
    setSessionCookie(response, "admin-session", token);
    setSessionCookie(
      response,
      "auth-session",
      JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.login,
        role: "ADMIN",
        isActive: true,
        isDefaultAdmin: true,
        createdAt: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    );

    return response;
  } catch (error) {
    console.error("admin.api.login failed", error);
    return NextResponse.json({ success: false, message: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
