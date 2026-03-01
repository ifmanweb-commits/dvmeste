import path from "path";
import { NextRequest } from "next/server";
import { servePublicFile, servePublicFileHead } from "@/lib/public-file-server";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  return servePublicFile(UPLOADS_DIR, pathSegments);
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  return servePublicFileHead(UPLOADS_DIR, pathSegments);
}
