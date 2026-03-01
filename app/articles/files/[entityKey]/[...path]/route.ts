import path from "path";
import { NextRequest } from "next/server";
import { servePublicFile, servePublicFileHead } from "@/lib/public-file-server";

const ARTICLES_FILES_DIR = path.join(process.cwd(), "public", "articles", "files");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityKey: string; path: string[] }> }
) {
  const { entityKey, path: pathSegments } = await params;
  return servePublicFile(ARTICLES_FILES_DIR, [entityKey, ...pathSegments]);
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ entityKey: string; path: string[] }> }
) {
  const { entityKey, path: pathSegments } = await params;
  return servePublicFileHead(ARTICLES_FILES_DIR, [entityKey, ...pathSegments]);
}
