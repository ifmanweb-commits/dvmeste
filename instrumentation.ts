/**
 * Instrumentation file for Next.js
 * This file is executed once when the server starts
 * Used for initializing cron jobs and other global services
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Register cron jobs
    const { startShuffleCatalogCron } = await import('@/lib/cron/shuffle-catalog')
    startShuffleCatalogCron()

    const { startCleanupArticleDraftsCron } = await import('@/lib/cron/cleanup-article-drafts')
    startCleanupArticleDraftsCron()

    const { startRecalculateArticleBonusCron } = await import('@/lib/cron/recalculate-article-bonus')
    startRecalculateArticleBonusCron()

    const { startCleanupAccessLogsCron } = await import('@/lib/cron/cleanup-access-logs')
    startCleanupAccessLogsCron()

    const { startBackupDatabaseCron } = await import('@/lib/cron/backup-database')
    startBackupDatabaseCron()
  }
}
