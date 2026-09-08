/*
  Warnings:

  - You are about to drop the `pd_areas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pd_categorias" DROP CONSTRAINT "pd_categorias_id_area_fkey";

-- DropForeignKey
ALTER TABLE "pd_tableros" DROP CONSTRAINT "pd_tableros_id_area_fkey";

-- DropForeignKey
ALTER TABLE "pd_tickets" DROP CONSTRAINT "pd_tickets_id_area_fkey";

-- DropTable
DROP TABLE "pd_areas";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_area" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_asignado_fkey" FOREIGN KEY ("id_asignado") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_categorias" ADD CONSTRAINT "pd_categorias_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tableros" ADD CONSTRAINT "pd_tableros_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
