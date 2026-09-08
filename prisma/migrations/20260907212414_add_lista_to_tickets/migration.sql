-- AlterTable
ALTER TABLE "pd_tickets" ADD COLUMN     "id_lista" INTEGER;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_lista_fkey" FOREIGN KEY ("id_lista") REFERENCES "pd_listas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
