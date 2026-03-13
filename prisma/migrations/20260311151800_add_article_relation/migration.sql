-- AddForeignKey
ALTER TABLE "ArticleCredit" ADD CONSTRAINT "ArticleCredit_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
