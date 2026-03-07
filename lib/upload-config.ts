// lib/upload-config.ts

export type UploadScope = "articles" | "pages" | "users-photos" | "users-docs";

interface ScopeConfig {
  allowedMimeTypes: string[];
  maxSizeMb: number;
}

export const UPLOAD_POLICIES: Record<UploadScope, ScopeConfig> = {
  'users-photos': {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMb: 5, 
  },
  'users-docs': {
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'application/pdf'
    ],
    maxSizeMb: 10,
  },
  pages: {
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'application/pdf'
    ],
    maxSizeMb: 10,
  },
  articles: {
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'application/pdf'
    ],
    maxSizeMb: 10,
  },
};