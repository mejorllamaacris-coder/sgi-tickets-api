-- AlterTable
ALTER TABLE "pd_tickets" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id_area_origen" INTEGER;
