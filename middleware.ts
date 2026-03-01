import type { NextRequest } from "next/server";
import { middleware as appMiddleware } from "./app/middleware";

export function middleware(request: NextRequest) {
  return appMiddleware(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/managers/:path*",
    "/api/admin/:path*",
    "/api/managers/:path*",
  ],
};
