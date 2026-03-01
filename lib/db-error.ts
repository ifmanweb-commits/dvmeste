   
                                                          
                                                    
   
export function isDbSyncError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("does not exist") ||
    msg.includes("Unknown column") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

export const DB_SYNC_MESSAGE =
  "База данных не синхронизирована со схемой. В корне проекта выполните: npx prisma db push";
