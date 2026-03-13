import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost || request.headers.get("host") || "").split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = (forwardedProto || request.nextUrl.protocol.replace(":", "") || "https")
    .split(",")[0]
    .trim();
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;

  const response = NextResponse.redirect(new URL("/admin/login", origin), { status: 303 });

  for (const name of [
    "auth-session",
    "admin_session",
    "admin-session",
    "manager_session",
    "manager-session",
  ]) {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}
