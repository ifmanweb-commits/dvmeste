                                                                          
import { unlink,  mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

                                            
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

   
                                
   
export async function deleteUploadedFile(filename: string): Promise<boolean> {
  try {
    const filepath = join(UPLOAD_DIR, filename);
    
    if (existsSync(filepath)) {
      await unlink(filepath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return false;
  }
}

   
                                 
   
export async function saveUploadedFile(file: File): Promise<string> {
                                      
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

                                 
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `image_${timestamp}_${random}.${extension}`;
  
  const filepath = join(UPLOAD_DIR, filename);
  
                               
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
                                                              
  await writeFile(filepath, buffer);

                                       
  return `/api/uploads/${filename}`;
}

   
                             
   
export function getFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  
                                                    
  const match = url.match(/\/api\/uploads\/([^\/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

   
                                              
   
export function isLocalUpload(url: string): boolean {
  return url.includes('/api/uploads/') && !url.startsWith('http');
}

   
                               
   
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `image_${timestamp}_${random}.${extension}`;
}